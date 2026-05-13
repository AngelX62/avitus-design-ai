import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { chooseAvaraTool, formatAvaraToolResponse } from "@/lib/avaraTools";

describe("Avara read-only Foundation tools", () => {
  it("routes common owner prompts to fixed toolbelt requests", () => {
    expect(chooseAvaraTool("What needs attention today?")).toEqual({
      tool: "list_action_queue",
      limit: 8,
    });
    expect(chooseAvaraTool("Show my Action Queue")).toEqual({
      tool: "list_action_queue",
      limit: 8,
    });
    expect(chooseAvaraTool("Which leads need follow-up?")).toMatchObject({
      tool: "query_leads",
      signal: "follow_ups_due",
    });
    expect(chooseAvaraTool("Show duplicates")).toMatchObject({
      tool: "query_leads",
      signal: "duplicates",
    });
    expect(chooseAvaraTool("Give me pipeline metrics")).toEqual({ tool: "pipeline_metrics" });
  });

  it("formats results with the Foundation no-external-action boundary", () => {
    const text = formatAvaraToolResponse({
      ok: true,
      tool: "query_leads",
      answer: "I found 1 lead for follow-ups.",
      items: [
        {
          id: "lead-1",
          full_name: "Maya Chen",
          status: "new",
          source: "manual",
          fit_score: null,
          classification: null,
          project_type: "Villa",
          budget_range: "$100k",
          timeline: "June",
          location: "Jakarta",
          missing_fields: ["contact"],
        },
      ],
    });

    expect(text).toContain("Maya Chen");
    expect(text).toContain("Tier 1 only");
    expect(text).toContain("no external action was taken");
  });

  it("formats Action Queue tool results without implying mutation or external sends", () => {
    const text = formatAvaraToolResponse({
      ok: true,
      tool: "list_action_queue",
      answer: "I found 1 Action Queue item from deterministic Foundation signals.",
      action_items: [
        {
          id: "missing-info",
          kind: "missing_info",
          tier: 1,
          title: "2 leads missing qualification info",
          reason: "At least one key Foundation field is missing.",
          suggestedAction: "Open the Missing info filter.",
          href: "/leads?signal=missing_info",
        },
      ],
    });

    expect(text).toContain("2 leads missing qualification info");
    expect(text).toContain("Next step: Open the Missing info filter.");
    expect(text).toContain("Tier 1 only");
    expect(text).toContain("no record was changed");
  });

  it("keeps the Edge Function tenant-scoped and non-AI", () => {
    const source = readFileSync("supabase/functions/avara-tools/index.ts", "utf8");

    expect(source).toContain('"list_action_queue"');
    expect(source).toContain('.eq("studio_id", studioId)');
    expect(source).toContain("requireStudioMember");
    expect(source).toContain("recordWorkflowAgentRun");
    expect(source).toContain("ACTION_RISK_TIER.OWNER_VISIBLE");
    expect(source).toContain('"pipeline_signals"');
    expect(source).not.toMatch(/email:\s*lead\.email/);
    expect(source).not.toMatch(/phone:\s*lead\.phone/);
    expect(source).not.toContain("callOpenAIJson");
    expect(source).not.toContain("OPENAI_API_KEY");
    expect(source).not.toMatch(/sendEmail|sendSms|whatsApp|whatsapp/i);
  });
});
