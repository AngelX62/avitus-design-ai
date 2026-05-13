import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(path, "utf8");

describe("no-key pilot security readiness gate", () => {
  it("keeps public intake slug-resolved and blocks direct studio_id intake", () => {
    const intake = source("supabase/functions/create-intake-lead/index.ts");
    const safety = source("supabase/functions/_shared/intakeSafety.ts");

    expect(intake).toContain("validatePublicIntakeSafety(rawPayload)");
    expect(intake).toContain('.from("studios")');
    expect(intake).toContain('.eq("slug", payload.studio_slug!.toLowerCase())');
    expect(intake).toContain("studio_id: studioId");
    expect(safety).toContain("hasDirectStudioId(payload)");
    expect(safety).toContain("Public intake must use a studio link");
  });

  it("requires server-side studio membership before tenant-scoped lead workflows", () => {
    const guardedFunctions = [
      "supabase/functions/create-pasted-lead/index.ts",
      "supabase/functions/create-manual-lead/index.ts",
      "supabase/functions/import-leads/index.ts",
      "supabase/functions/extract-lead/index.ts",
      "supabase/functions/score-lead/index.ts",
      "supabase/functions/avara-tools/index.ts",
    ];

    for (const path of guardedFunctions) {
      const fn = source(path);
      expect(fn, path).toContain("requireUser");
      expect(fn, path).toContain("requireStudioMember");
      expect(fn, path).toContain("payload.studio_id");
    }
  });

  it("keeps invite creation owner-only and invite acceptance token/email-bound", () => {
    const createInvite = source("supabase/functions/create-invite/index.ts");
    const acceptInvite = source("supabase/functions/accept-invite/index.ts");

    expect(createInvite).toContain("requireStudioOwner");
    expect(createInvite).toContain("hashToken(token)");
    expect(createInvite).toContain("token_hash");
    expect(acceptInvite).toContain("hashToken(payload.token)");
    expect(acceptInvite).toContain('.eq("token_hash", tokenHash)');
    expect(acceptInvite).toContain("Sign in with the invited email address");
    expect(acceptInvite).toContain("studio_id: invite.studio_id");
  });

  it("keeps Avara tools fixed, tenant-scoped, read-only, and non-AI in Foundation", () => {
    const avara = source("supabase/functions/avara-tools/index.ts");

    expect(avara).toContain("z.enum");
    expect(avara).toContain('"list_action_queue"');
    expect(avara).toContain('.eq("studio_id", studioId)');
    expect(avara).toContain("requireStudioMember");
    expect(avara).toContain("ACTION_RISK_TIER.OWNER_VISIBLE");
    expect(avara).toContain("recordWorkflowAgentRun");
    expect(avara).not.toContain("callOpenAIJson");
    expect(avara).not.toContain("OPENAI_API_KEY");
    expect(avara).not.toMatch(/sendEmail|sendSms|whatsApp|whatsapp/i);
  });
});
