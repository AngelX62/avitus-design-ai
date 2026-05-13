import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  computeWeightedLeadScore,
  type LeadScoringSignals,
  type ScoringSignal,
} from "../../supabase/functions/_shared/deterministicScoring.ts";
import { ACTION_RISK_TIER } from "../../supabase/functions/_shared/actionTiers.ts";
import {
  AI_NOT_CONFIGURED_STATUS,
  analysisStatusForAI,
  createFallbackExtractedLead,
  createNoAIAnalysisResult,
  isOpenAIKeyConfigured,
} from "../../supabase/functions/_shared/aiAvailability.ts";
import { normalizeImportRow } from "../../supabase/functions/_shared/importHelpers.ts";
import { validatePublicIntakeSafety } from "../../supabase/functions/_shared/intakeSafety.ts";
import { buildManualLeadInsert } from "../../supabase/functions/_shared/manualLead.ts";
import {
  buildAgentContext,
  DEFAULT_AI_QUALIFICATION_PROMPT_PACK_VERSION,
  DEFAULT_LEAD_ANALYSIS_SCHEMA_VERSION,
  DEFAULT_NO_KEY_PROMPT_PACK_VERSION,
  describeAgentContextForLeadIntelligence,
  recordWorkflowAgentRun,
  resolvePromptPackVersion,
} from "../../supabase/functions/_shared/orchestrator.ts";
import {
  resolvePromptPack,
  type PromptPackSupabaseClient,
} from "../../supabase/functions/_shared/promptPacks.ts";
import { getLeadAnalysisStatusCopy } from "../lib/leadTypes";

const signals = (signal: ScoringSignal): LeadScoringSignals => ({
  budget_fit: { signal, reason: "Budget matches the target range.", evidence: "$100k budget" },
  timeline_fit: { signal, reason: "Timeline is clear.", evidence: "3-6 months" },
  location_fit: { signal, reason: "Location is serviceable.", evidence: "Jakarta" },
  project_type_fit: { signal, reason: "Project type is in scope.", evidence: "Full home" },
  decision_maker: { signal, reason: "Requester appears ready to decide.", evidence: "Owner is enquiring" },
  clarity: { signal, reason: "The request is clear.", evidence: "Scope and rooms included" },
});

const createPromptPackSupabase = ({
  pin = null,
  packs = [],
  promptPackError = false,
}: {
  pin?: Record<string, unknown> | null;
  packs?: Record<string, unknown>[];
  promptPackError?: boolean;
}): PromptPackSupabaseClient => ({
  from: (table: string) => {
    const filters: Record<string, unknown> = {};
    const chain = {
      select: () => chain,
      eq: (column: string, value: unknown) => {
        filters[column] = value;
        return chain;
      },
      maybeSingle: async () => {
        if (table === "studio_prompt_pack_pins") {
          const matchesPin =
            pin &&
            Object.entries(filters).every(([column, value]) => pin[column] === value);

          return { data: matchesPin ? pin : null, error: null };
        }

        if (table === "prompt_packs") {
          if (promptPackError) return { data: null, error: { message: "relation does not exist" } };

          const pack = packs.find((candidate) =>
            Object.entries(filters).every(([column, value]) => candidate[column] === value),
          );

          return { data: pack ?? null, error: null };
        }

        return { data: null, error: { message: "unknown table" } };
      },
    };

    return chain;
  },
});

describe("deterministic lead scoring", () => {
  it("returns the same weighted score for the same interpretation", () => {
    const input = signals("strong");
    const contact = { email: "client@example.com", phone: null };

    expect(computeWeightedLeadScore(input, contact)).toEqual(computeWeightedLeadScore(input, contact));
  });

  it("forces needs_review when usable contact is missing", () => {
    const score = computeWeightedLeadScore(signals("strong"), {
      email: "unknown+1234@intake.avitus",
      phone: null,
    });

    expect(score.total_score).toBe(100);
    expect(score.classification).toBe("needs_review");
    expect(score.review_reasons).toContain("Missing usable contact information.");
  });

  it("classifies low scores as not_fit without inventing a lost status", () => {
    const score = computeWeightedLeadScore(signals("weak"), {
      email: "client@example.com",
      phone: null,
    });

    expect(score.total_score).toBe(20);
    expect(score.classification).toBe("not_fit");
    expect(String(score.classification)).not.toBe("lost");
  });

  it("sets total_score to the sum of weighted criteria", () => {
    const score = computeWeightedLeadScore(
      {
        budget_fit: { signal: "strong" },
        timeline_fit: { signal: "partial" },
        location_fit: { signal: "weak" },
        project_type_fit: { signal: "strong" },
        decision_maker: { signal: "partial" },
        clarity: { signal: "unknown" },
      },
      { email: "client@example.com", phone: null },
    );

    const criterionTotal = score.criteria.reduce((sum, criterion) => sum + criterion.awarded_points, 0);
    expect(score.total_score).toBe(criterionTotal);
  });
});

describe("import row normalization", () => {
  it("maps known columns into core lead fields", () => {
    const normalized = normalizeImportRow(
      { Name: "Jane Lee", Email: "jane@example.com", Budget: "$100k-$250k" },
      { Name: "full_name", Email: "email", Budget: "budget_range" },
    );

    expect(normalized.skippedReason).toBeNull();
    expect(normalized.lead.full_name).toBe("Jane Lee");
    expect(normalized.lead.email).toBe("jane@example.com");
    expect(normalized.lead.budget_range).toBe("$100k-$250k");
  });

  it("preserves unmapped and custom columns under custom_fields", () => {
    const normalized = normalizeImportRow(
      { Name: "Jane Lee", Instagram: "@jane", Designer: "Mira" },
      { Name: "full_name", Designer: "custom" },
    );

    expect(normalized.customFieldCount).toBe(2);
    expect(normalized.lead.custom_fields).toEqual({ Designer: "Mira", Instagram: "@jane" });
  });

  it("preserves a mapped source as custom metadata while leaving ingestion source to the import workflow", () => {
    const normalized = normalizeImportRow(
      { Name: "Jane Lee", Source: "Instagram" },
      { Name: "full_name", Source: "source" },
    );

    expect(normalized.lead.source).toBeUndefined();
    expect(normalized.lead.custom_fields).toEqual({ original_source: "Instagram" });
  });

  it("skips rows without a full name and returns a reason", () => {
    const normalized = normalizeImportRow(
      { Email: "nameless@example.com" },
      { Email: "email" },
    );

    expect(normalized.skippedReason).toBe("Missing full name");
  });
});

describe("public intake safety", () => {
  it("accepts public intake when a studio_slug is provided", () => {
    expect(validatePublicIntakeSafety({ studio_slug: "avitus" })).toEqual({ ok: true, ignored: false });
  });

  it("rejects direct studio_id in public intake", () => {
    const result = validatePublicIntakeSafety({
      studio_id: "00000000-0000-0000-0000-000000000000",
      studio_slug: "avitus",
    });

    expect(result.ok).toBe(false);
    expect("status" in result ? result.status : null).toBe(400);
  });

  it("ignores honeypot submissions without creating a normal lead", () => {
    expect(validatePublicIntakeSafety({ studio_slug: "avitus", website: "https://bot.example" })).toEqual({
      ok: true,
      ignored: true,
    });
  });
});

describe("OpenAI-later dormant mode", () => {
  it("detects OpenAI availability from the API key only", () => {
    expect(isOpenAIKeyConfigured(() => undefined)).toBe(false);
    expect(isOpenAIKeyConfigured(() => "   ")).toBe(false);
    expect(isOpenAIKeyConfigured((key) => key === "OPENAI_API_KEY" ? "sk-test" : undefined)).toBe(true);
  });

  it("uses not_configured instead of pending when AI is unavailable", () => {
    expect(analysisStatusForAI(false)).toBe(AI_NOT_CONFIGURED_STATUS);
    expect(analysisStatusForAI(true)).toBe("pending");
  });

  it("does not create fake scores or classifications in dormant mode", () => {
    expect(createNoAIAnalysisResult()).toEqual({
      ai_available: false,
      status: "not_configured",
      fit_score: null,
      classification: null,
      temperature: null,
      score_breakdown: null,
    });
  });

  it("maps AI analysis statuses to no-key-ready UI copy", () => {
    expect(getLeadAnalysisStatusCopy("not_configured").title).toBe("Analysis not enabled yet");
    expect(getLeadAnalysisStatusCopy("pending").title).toBe("Pending analysis");
    expect(getLeadAnalysisStatusCopy("not_started").title).toBe("Pending analysis");
    expect(getLeadAnalysisStatusCopy("failed", "Timeout").title).toBe("Analysis unavailable");
    expect(getLeadAnalysisStatusCopy("failed", "Timeout").body).toBe("Timeout");
    expect(getLeadAnalysisStatusCopy("complete").title).toBe("Analysis complete");
  });

  it("creates an editable pasted-lead fallback when AI extraction is unavailable", () => {
    const extracted = createFallbackExtractedLead("Hello, I want to renovate my apartment.", "whatsapp");

    expect(extracted.full_name).toBe("WhatsApp lead");
    expect(extracted.email).toBeNull();
    expect(extracted.phone).toBeNull();
    expect(extracted.missing_info).toContain("Email or phone number");
  });

  it("builds manual leads as no-key manual review records", () => {
    const lead = buildManualLeadInsert(
      {
        studio_id: "00000000-0000-0000-0000-000000000001",
        full_name: "Jane Lee",
        email: "",
        phone: "",
        project_type: "Full home",
        location: "Jakarta",
        budget_range: "$100k-$250k",
        brief: "Client wants a full home redesign.",
      },
      "00000000-0000-0000-0000-000000000002",
      false,
      "manualtest",
    );

    expect(lead.ai_analysis_status).toBe(AI_NOT_CONFIGURED_STATUS);
    expect(lead.email).toBe("unknown+manualtest@manual.avitus");
    expect(lead.source).toBe("manual");
    expect(lead.raw_inquiry).toBe("Client wants a full home redesign.");
    expect(lead.fit_score).toBeNull();
    expect(lead.classification).toBeNull();
    expect(lead.temperature).toBeNull();
    expect(lead.score_breakdown).toBeNull();
  });
});

describe("Central Lead Intelligence Orchestrator spine", () => {
  it("builds AgentContext from studio settings and workflow metadata", () => {
    const context = buildAgentContext({
      studio_id: "00000000-0000-0000-0000-000000000001",
      studio: {
        studio_name: "Avitus Studio",
        currency: "IDR",
        ideal_client: "Renovation-ready homeowners",
        target_budget_min: 100000000,
        target_budget_max: "500000000",
        preferred_project_types: ["Full home", "Villa"],
        preferred_locations: ["Jakarta", "Bali"],
        signature_styles: ["Warm minimal"],
        low_fit_signs: "Requests free design work",
        followup_tone: "consultative",
      },
      run_id: "00000000-0000-0000-0000-000000000099",
      requested_tier: ACTION_RISK_TIER.SILENT_INTERNAL,
    });

    expect(context).toMatchObject({
      studio_id: "00000000-0000-0000-0000-000000000001",
      vertical: "interior_design",
      language: "en",
      currency: "IDR",
      prompt_pack_version: DEFAULT_NO_KEY_PROMPT_PACK_VERSION,
      schema_version: DEFAULT_LEAD_ANALYSIS_SCHEMA_VERSION,
      run_id: "00000000-0000-0000-0000-000000000099",
      requested_tier: ACTION_RISK_TIER.SILENT_INTERNAL,
    });
    expect(context.qualification_profile.preferred_project_types).toEqual(["Full home", "Villa"]);
    expect(context.qualification_profile.target_budget_max).toBe(500000000);
    expect(context.brand_voice.tone).toBe("consultative");
    expect(describeAgentContextForLeadIntelligence(context)).toContain("Target budget: IDR 100000000-500000000");
  });

  it("keeps prompt pack defaults explicit for no-key and AI qualification workflows", () => {
    expect(resolvePromptPackVersion(false)).toBe(DEFAULT_NO_KEY_PROMPT_PACK_VERSION);
    expect(resolvePromptPackVersion(true)).toBe(DEFAULT_AI_QUALIFICATION_PROMPT_PACK_VERSION);
    expect(resolvePromptPackVersion(false, "custom-pack")).toBe("custom-pack");
  });

  it("resolves the active stable prompt pack default from the database", async () => {
    const supabase = createPromptPackSupabase({
      packs: [
        {
          service_name: "lead_intelligence",
          vertical: "interior_design",
          language: "en",
          version: "stable-pack-v1",
          release_channel: "stable",
          is_active: true,
          is_default: true,
          system_prompt: "Stable Lead Intelligence prompt",
          output_schema_jsonb: { type: "object" },
          examples_jsonb: [],
          tier_policy_jsonb: { produced_tier: 0 },
          model_policy_jsonb: { temperature: 0.2 },
        },
      ],
    });

    const pack = await resolvePromptPack(supabase, {
      studio_id: "00000000-0000-0000-0000-000000000001",
      service_name: "lead_intelligence",
      vertical: "interior_design",
      language: "en",
    });

    expect(pack).toMatchObject({
      source: "database",
      version: "stable-pack-v1",
      release_channel: "stable",
      system_prompt: "Stable Lead Intelligence prompt",
      output_schema_jsonb: { type: "object" },
      tier_policy_jsonb: { produced_tier: 0 },
    });
  });

  it("resolves an exact pinned prompt pack version", async () => {
    const supabase = createPromptPackSupabase({
      pin: {
        studio_id: "00000000-0000-0000-0000-000000000001",
        service_name: "lead_intelligence",
        vertical: "interior_design",
        language: "en",
        release_channel: "pinned",
        prompt_pack_version: "lead-intel-pinned-v2",
      },
      packs: [
        {
          service_name: "lead_intelligence",
          vertical: "interior_design",
          language: "en",
          version: "lead-intel-pinned-v2",
          release_channel: "stable",
          is_active: true,
          is_default: false,
          system_prompt: "Pinned Lead Intelligence prompt",
          output_schema_jsonb: { type: "object" },
          examples_jsonb: [],
          tier_policy_jsonb: { produced_tier: 0 },
          model_policy_jsonb: { temperature: 0.15 },
        },
      ],
    });

    const pack = await resolvePromptPack(supabase, {
      studio_id: "00000000-0000-0000-0000-000000000001",
      service_name: "lead_intelligence",
      vertical: "interior_design",
      language: "en",
    });

    expect(pack).toMatchObject({
      source: "database",
      version: "lead-intel-pinned-v2",
      release_channel: "pinned",
      system_prompt: "Pinned Lead Intelligence prompt",
    });
  });

  it("falls back to current constants when prompt pack storage is unavailable", async () => {
    const supabase = createPromptPackSupabase({ promptPackError: true });

    const pack = await resolvePromptPack(supabase, {
      studio_id: "00000000-0000-0000-0000-000000000001",
      service_name: "lead_intelligence",
      vertical: "interior_design",
      language: "en",
    });

    expect(pack.source).toBe("fallback");
    expect(pack.version).toBe(DEFAULT_AI_QUALIFICATION_PROMPT_PACK_VERSION);
    expect(pack.system_prompt).toContain("Lead Intelligence Service");
    expect(pack.output_schema_jsonb).toMatchObject({ type: "object" });
  });

  it("rejects Tier 2+ for V1 Foundation no-key workflows", () => {
    expect(() =>
      buildAgentContext({
        studio_id: "00000000-0000-0000-0000-000000000001",
        requested_tier: ACTION_RISK_TIER.PREPARED_DRAFT,
      }),
    ).toThrow(/V1 Foundation cannot execute Action Risk Tier 2/);
  });

  it("records tenant-scoped workflow agent_runs metadata through the orchestrator", async () => {
    const inserted: Record<string, unknown>[] = [];
    const supabase = {
      from: (table: "agent_runs") => ({
        insert: async (values: Record<string, unknown>) => {
          inserted.push({ table, ...values });
          return { error: null };
        },
      }),
    };
    const context = buildAgentContext({
      studio_id: "00000000-0000-0000-0000-000000000001",
      schema_version: "lead-intake-v1",
      run_id: "00000000-0000-0000-0000-000000000099",
      requested_tier: ACTION_RISK_TIER.SILENT_INTERNAL,
    });

    await recordWorkflowAgentRun(supabase, context, {
      lead_id: "00000000-0000-0000-0000-000000000002",
      agent_name: "Lead Intake Router",
      service_name: "lead_intelligence",
      model: "not_configured",
      input: { source: "manual", ai_available: false },
      structured_output_jsonb: { ai_analysis_status: "not_configured" },
      status: "success",
      created_by: "00000000-0000-0000-0000-000000000003",
    });

    expect(inserted).toHaveLength(1);
    expect(inserted[0]).toMatchObject({
      table: "agent_runs",
      studio_id: "00000000-0000-0000-0000-000000000001",
      lead_id: "00000000-0000-0000-0000-000000000002",
      service_name: "lead_intelligence",
      model: "not_configured",
      prompt_pack_version: DEFAULT_NO_KEY_PROMPT_PACK_VERSION,
      schema_version: "lead-intake-v1",
      run_id: "00000000-0000-0000-0000-000000000099",
      tier: ACTION_RISK_TIER.SILENT_INTERNAL,
      status: "success",
      latency_ms: 0,
      prompt_tokens: 0,
      completion_tokens: 0,
      cost_usd: 0,
    });
    expect(inserted[0].input_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("records agent_runs with the resolved prompt pack version", async () => {
    const inserted: Record<string, unknown>[] = [];
    const supabaseForRuns = {
      from: (table: "agent_runs") => ({
        insert: async (values: Record<string, unknown>) => {
          inserted.push({ table, ...values });
          return { error: null };
        },
      }),
    };
    const promptPack = await resolvePromptPack(
      createPromptPackSupabase({
        packs: [
          {
            service_name: "lead_intelligence",
            vertical: "interior_design",
            language: "en",
            version: "stable-pack-v1",
            release_channel: "stable",
            is_active: true,
            is_default: true,
            system_prompt: "Stable Lead Intelligence prompt",
            output_schema_jsonb: { type: "object" },
            examples_jsonb: [],
            tier_policy_jsonb: { produced_tier: 0 },
            model_policy_jsonb: { temperature: 0.2 },
          },
        ],
      }),
      {
        studio_id: "00000000-0000-0000-0000-000000000001",
        service_name: "lead_intelligence",
        vertical: "interior_design",
        language: "en",
      },
    );
    const context = buildAgentContext({
      studio_id: "00000000-0000-0000-0000-000000000001",
      prompt_pack: promptPack,
      schema_version: DEFAULT_LEAD_ANALYSIS_SCHEMA_VERSION,
      run_id: "00000000-0000-0000-0000-000000000099",
      requested_tier: ACTION_RISK_TIER.SILENT_INTERNAL,
    });

    await recordWorkflowAgentRun(supabaseForRuns, context, {
      agent_name: "Lead Intelligence Service",
      service_name: "lead_intelligence",
      model: "gpt-5.4-mini",
      input: { ai_available: true },
      structured_output_jsonb: { status: "complete" },
      status: "success",
    });

    expect(context.prompt_pack_version).toBe("stable-pack-v1");
    expect(context.prompt_pack?.source).toBe("database");
    expect(inserted[0]).toMatchObject({
      prompt_pack_version: "stable-pack-v1",
      schema_version: DEFAULT_LEAD_ANALYSIS_SCHEMA_VERSION,
      tier: ACTION_RISK_TIER.SILENT_INTERNAL,
      status: "success",
    });
  });
});

describe("lead insert RLS migration", () => {
  it("restricts direct lead inserts to authenticated studio members", () => {
    const migration = readFileSync(
      "supabase/migrations/20260430090000_restrict_lead_inserts_to_studio_members.sql",
      "utf8",
    );

    expect(migration).toContain('DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.leads');
    expect(migration).not.toContain('CREATE POLICY "Anyone can submit a lead"');
    expect(migration).toMatch(/CREATE POLICY "Studio members insert leads"[\s\S]*FOR INSERT TO authenticated/);
    expect(migration).toMatch(/WITH CHECK \(public\.is_studio_member\(studio_id\)\)/);
  });
});

describe("AI-ready lead analysis schema", () => {
  it("keeps structured interpretation fields ready for later server-side AI", () => {
    const schema = readFileSync("supabase/functions/_shared/leadSchemas.ts", "utf8");

    expect(schema).toContain("leadInterpretationSchema");
    expect(schema).toContain("summary");
    expect(schema).toContain("next_action");
    expect(schema).toContain("suggested_followup");
    expect(schema).toContain("missing_info");
    expect(schema).toContain("red_flags");
    expect(schema).toContain("scoring_signals");
    expect(schema).toContain("budget_fit");
    expect(schema).toContain("timeline_fit");
    expect(schema).toContain("location_fit");
    expect(schema).toContain("project_type_fit");
    expect(schema).toContain("decision_maker");
    expect(schema).toContain("clarity");
  });

  it("standardizes AI-ready lead fields and dormant defaults in migration", () => {
    const migration = readFileSync(
      "supabase/migrations/20260430110000_standardize_ai_ready_lead_analysis.sql",
      "utf8",
    );

    [
      "ai_summary",
      "ai_next_action",
      "ai_reply_draft",
      "ai_red_flags",
      "ai_processed_at",
      "ai_analysis_status",
      "ai_analysis_error",
      "ai_model",
      "fit_score",
      "classification",
      "temperature",
      "missing_info",
      "suggested_followup",
      "score_breakdown",
    ].forEach((column) => {
      expect(migration).toContain(`ADD COLUMN IF NOT EXISTS ${column}`);
    });

    expect(migration).toContain("ALTER COLUMN ai_analysis_status SET DEFAULT 'not_configured'");
    expect(migration).toContain("ALTER COLUMN score_breakdown DROP DEFAULT");
    expect(migration).toContain("'not_configured', 'pending', 'complete', 'failed', 'not_started'");
  });
});

describe("Edge Function CORS defaults", () => {
  it("allows common local Vite origins used for intake smoke tests", () => {
    const cors = readFileSync("supabase/functions/_shared/cors.ts", "utf8");

    expect(cors).toContain("http://localhost:5173");
    expect(cors).toContain("http://127.0.0.1:5173");
    expect(cors).toContain("http://localhost:8082");
    expect(cors).toContain("http://127.0.0.1:8082");
  });
});
