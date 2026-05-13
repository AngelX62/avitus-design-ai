import { describe, expect, it } from "vitest";
import { ACTION_RISK_TIER } from "@/lib/actionTiers";
import { buildActionQueueItems } from "@/lib/actionQueue";
import { chooseAvaraTool, formatAvaraToolResponse, type AvaraToolRequest, type AvaraToolResponse } from "@/lib/avaraTools";
import { buildDuplicateKeySet, matchesInboxSignal } from "@/lib/inboxFilters";
import { selectPriorityLeads } from "@/lib/leadPriority";
import { buildLeadStats, type LeadStatsLead } from "@/lib/leadStats";
import { canTransitionLeadStatus, type LeadStatus } from "@/lib/leadTypes";
import {
  analysisStatusForAI,
  createFallbackExtractedLead,
  createNoAIAnalysisResult,
} from "../../supabase/functions/_shared/aiAvailability.ts";
import { normalizeImportRow } from "../../supabase/functions/_shared/importHelpers.ts";
import { validatePublicIntakeSafety } from "../../supabase/functions/_shared/intakeSafety.ts";
import { buildManualLeadInsert } from "../../supabase/functions/_shared/manualLead.ts";

const STUDIO_A = "11111111-1111-4111-8111-111111111111";
const STUDIO_B = "22222222-2222-4222-8222-222222222222";
const USER_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const USER_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const NOW = new Date("2026-05-12T10:00:00.000Z");

const LEAD_A_INTAKE = "aaaaaaaa-0001-4000-8000-000000000001";
const LEAD_A_PASTED = "aaaaaaaa-0002-4000-8000-000000000002";
const LEAD_A_MANUAL = "aaaaaaaa-0003-4000-8000-000000000003";
const LEAD_A_IMPORT = "aaaaaaaa-0004-4000-8000-000000000004";
const LEAD_B = "bbbbbbbb-0001-4000-8000-000000000001";

type StudioScoped = { studio_id: string };

type PilotStudio = StudioScoped & {
  id: string;
  slug: string;
  studio_name: string;
};

type PilotLead = LeadStatsLead &
  StudioScoped & {
    created_by?: string | null;
    custom_fields?: Record<string, string>;
    temperature?: string | null;
    score_breakdown?: unknown;
  };

type PilotActivity = StudioScoped & {
  id: string;
  lead_id: string;
  kind: "note";
  body: string;
  author_id: string;
  created_at: string;
};

type PilotStatusHistory = StudioScoped & {
  lead_id: string;
  from_status: string;
  to_status: string;
  changed_by: string;
  changed_at: string;
};

type PilotProject = StudioScoped & {
  id: string;
  lead_id: string;
  name: string;
  client_name: string;
  status: "active";
  created_by: string;
};

type PilotAgentRun = StudioScoped & {
  run_id: string;
  lead_id?: string | null;
  service_name: "lead_intelligence" | "pipeline_signals" | "reporting";
  tool?: string;
  tier: number;
  model: string;
  raw_text: string | null;
};

type PilotFixture = {
  studios: PilotStudio[];
  settings: Array<StudioScoped & { currency: string; followup_tone: string }>;
  leads: PilotLead[];
  activities: PilotActivity[];
  statusHistory: PilotStatusHistory[];
  projects: PilotProject[];
  agentRuns: PilotAgentRun[];
};

const noAiFields = () => ({
  ai_analysis_status: analysisStatusForAI(false),
  fit_score: null,
  classification: null,
  temperature: null,
  score_breakdown: null,
});

const makeLead = (overrides: Partial<PilotLead> & Pick<PilotLead, "id" | "studio_id" | "full_name">): PilotLead => ({
  status: "new",
  source: "manual",
  ai_next_action: null,
  email: null,
  phone: null,
  project_type: null,
  property_type: null,
  location: null,
  budget_range: null,
  timeline: null,
  raw_inquiry: null,
  brief: null,
  created_at: NOW.toISOString(),
  reminder_at: null,
  last_contacted_at: null,
  custom_fields: {},
  ...noAiFields(),
  ...overrides,
});

const createPilotFixture = (): PilotFixture => {
  const pasted = createFallbackExtractedLead(
    "WhatsApp: I need help renovating a villa in Bali. Budget still unclear.",
    "whatsapp",
  );
  const manual = buildManualLeadInsert(
    {
      studio_id: STUDIO_A,
      full_name: "Maya Manual",
      email: "shared-a@example.com",
      phone: "",
      project_type: "Villa renovation",
      location: "Bali",
      budget_range: "$100k-$250k",
      brief: "Owner-created lead for a villa renovation.",
    },
    USER_A,
    false,
    "pilotmanual",
  );
  const imported = normalizeImportRow(
    {
      Name: "Ika Import",
      Email: "shared-a@example.com",
      Budget: "$100k-$250k",
      Timeline: "June",
      Designer: "Mira",
      Instagram: "@ika.home",
    },
    {
      Name: "full_name",
      Email: "email",
      Budget: "budget_range",
      Timeline: "timeline",
      Designer: "custom",
    },
  );

  return {
    studios: [
      { id: STUDIO_A, studio_id: STUDIO_A, slug: "atelier-north", studio_name: "Atelier North" },
      { id: STUDIO_B, studio_id: STUDIO_B, slug: "studio-south", studio_name: "Studio South" },
    ],
    settings: [
      { studio_id: STUDIO_A, currency: "USD", followup_tone: "consultative" },
      { studio_id: STUDIO_B, currency: "IDR", followup_tone: "warm" },
    ],
    leads: [
      makeLead({
        id: LEAD_A_INTAKE,
        studio_id: STUDIO_A,
        full_name: "Ava Intake",
        status: "needs_review",
        source: "intake_form",
        email: "unknown+pilot@intake.avitus",
        created_at: "2026-05-01T09:00:00.000Z",
        reminder_at: "2026-05-10T09:00:00.000Z",
        raw_inquiry: "Public intake form submission.",
        brief: "Public intake form submission.",
      }),
      makeLead({
        id: LEAD_A_PASTED,
        studio_id: STUDIO_A,
        full_name: pasted.full_name,
        status: "new",
        source: "pasted",
        project_type: pasted.project_type,
        property_type: pasted.property_type,
        location: pasted.location,
        budget_range: pasted.budget_range,
        timeline: pasted.timeline,
        raw_inquiry: "WhatsApp: I need help renovating a villa in Bali. Budget still unclear.",
        brief: "WhatsApp: I need help renovating a villa in Bali. Budget still unclear.",
        created_at: "2026-04-28T09:00:00.000Z",
      }),
      makeLead({
        id: LEAD_A_MANUAL,
        ...manual,
        studio_id: STUDIO_A,
        status: "new",
        created_at: "2026-05-08T09:00:00.000Z",
        timeline: "This quarter",
      }),
      makeLead({
        id: LEAD_A_IMPORT,
        studio_id: STUDIO_A,
        full_name: String(imported.lead.full_name),
        email: String(imported.lead.email),
        status: "new",
        source: "imported",
        budget_range: String(imported.lead.budget_range),
        timeline: String(imported.lead.timeline),
        created_at: "2026-05-09T09:00:00.000Z",
        custom_fields: imported.lead.custom_fields as Record<string, string>,
      }),
      makeLead({
        id: LEAD_B,
        studio_id: STUDIO_B,
        full_name: "Bela Other Studio",
        status: "new",
        source: "manual",
        email: "bela@example.com",
        project_type: "Apartment refresh",
        location: "Jakarta",
        budget_range: "$50k",
        timeline: "July",
      }),
    ],
    activities: [
      {
        id: "activity-b",
        studio_id: STUDIO_B,
        lead_id: LEAD_B,
        kind: "note",
        body: "Private note for Studio B",
        author_id: USER_B,
        created_at: "2026-05-10T09:00:00.000Z",
      },
    ],
    statusHistory: [],
    projects: [
      {
        id: "project-b",
        studio_id: STUDIO_B,
        lead_id: LEAD_B,
        name: "Bela Other Studio project",
        client_name: "Bela Other Studio",
        status: "active",
        created_by: USER_B,
      },
    ],
    agentRuns: [
      {
        run_id: "run-b",
        studio_id: STUDIO_B,
        lead_id: LEAD_B,
        service_name: "lead_intelligence",
        tier: ACTION_RISK_TIER.SILENT_INTERNAL,
        model: "not_configured",
        raw_text: null,
      },
    ],
  };
};

const forStudio = <T extends StudioScoped>(records: T[], studioId: string) =>
  records.filter((record) => record.studio_id === studioId);

const findStudioLead = (fixture: PilotFixture, studioId: string, leadId: string) =>
  fixture.leads.find((lead) => lead.studio_id === studioId && lead.id === leadId);

const expectOnlyStudio = <T extends StudioScoped>(records: T[], studioId: string) => {
  expect(records.length).toBeGreaterThan(0);
  expect(records.every((record) => record.studio_id === studioId)).toBe(true);
};

const addNote = (fixture: PilotFixture, studioId: string, leadId: string, body: string) => {
  const lead = findStudioLead(fixture, studioId, leadId);
  if (!lead) throw new Error("Lead not found in this studio");

  fixture.activities.push({
    id: `note-${fixture.activities.length + 1}`,
    studio_id: studioId,
    lead_id: leadId,
    kind: "note",
    body,
    author_id: studioId === STUDIO_A ? USER_A : USER_B,
    created_at: NOW.toISOString(),
  });
};

const setReminder = (fixture: PilotFixture, studioId: string, leadId: string, reminderAt: string) => {
  const lead = findStudioLead(fixture, studioId, leadId);
  if (!lead) throw new Error("Lead not found in this studio");
  lead.reminder_at = reminderAt;
};

const updateStatus = (
  fixture: PilotFixture,
  studioId: string,
  leadId: string,
  nextStatus: LeadStatus,
  userId: string,
) => {
  const lead = findStudioLead(fixture, studioId, leadId);
  if (!lead) throw new Error("Lead not found in this studio");

  const previousStatus = lead.status as LeadStatus;
  if (!canTransitionLeadStatus(previousStatus, nextStatus)) throw new Error("Status transition not allowed");

  lead.status = nextStatus;
  fixture.statusHistory.push({
    studio_id: studioId,
    lead_id: leadId,
    from_status: previousStatus,
    to_status: nextStatus,
    changed_by: userId,
    changed_at: NOW.toISOString(),
  });

  if (nextStatus === "won" && !fixture.projects.some((project) => project.lead_id === leadId)) {
    fixture.projects.push({
      id: `project-${leadId}`,
      studio_id: studioId,
      lead_id: leadId,
      name: `${lead.full_name} project`,
      client_name: lead.full_name,
      status: "active",
      created_by: userId,
    });
  }
};

const safeAvaraLead = (lead: PilotLead) => ({
  id: lead.id,
  full_name: lead.full_name,
  status: lead.status,
  source: lead.source,
  fit_score: lead.fit_score,
  classification: lead.classification,
  project_type: lead.project_type,
  budget_range: lead.budget_range,
  timeline: lead.timeline,
  location: lead.location ?? null,
});

const runPilotAvaraTool = (
  fixture: PilotFixture,
  studioId: string,
  request: AvaraToolRequest,
): AvaraToolResponse => {
  const studioLeads = forStudio(fixture.leads, studioId);
  const tier = ACTION_RISK_TIER.OWNER_VISIBLE;
  const run: PilotAgentRun = {
    run_id: `run-${fixture.agentRuns.length + 1}`,
    studio_id: studioId,
    service_name: request.tool === "pipeline_metrics"
      ? "reporting"
      : request.tool === "list_action_queue"
        ? "pipeline_signals"
        : "lead_intelligence",
    tool: request.tool,
    tier,
    model: "not_configured",
    raw_text: null,
  };
  fixture.agentRuns.push(run);

  if (request.tool === "list_action_queue") {
    const actionItems = buildActionQueueItems(buildLeadStats(studioLeads, NOW)).slice(0, request.limit ?? 8);
    return {
      ok: true,
      tool: request.tool,
      tier,
      answer: `I found ${actionItems.length} Action Queue item${actionItems.length === 1 ? "" : "s"} from deterministic Foundation signals.`,
      action_items: actionItems,
    };
  }

  if (request.tool === "query_leads") {
    const duplicateKeys = buildDuplicateKeySet(studioLeads);
    const matches = request.signal
      ? studioLeads.filter((lead) => matchesInboxSignal(lead, NOW, request.signal, duplicateKeys))
      : studioLeads;

    return {
      ok: true,
      tool: request.tool,
      tier,
      answer: `I found ${matches.length} tenant-scoped lead${matches.length === 1 ? "" : "s"}.`,
      items: matches.slice(0, request.limit ?? 8).map(safeAvaraLead),
    };
  }

  if (request.tool === "get_lead_detail" || request.tool === "explain_score") {
    const lead = request.lead_id ? findStudioLead(fixture, studioId, request.lead_id) : null;
    if (!lead) return { ok: false, tool: request.tool, tier, error: "Lead not found in this studio" };

    if (request.tool === "explain_score" && lead.fit_score == null) {
      return {
        ok: true,
        tool: request.tool,
        tier,
        answer: `${lead.full_name} does not have an AI score yet. No fake score was generated.`,
      };
    }

    return {
      ok: true,
      tool: request.tool,
      tier,
      answer: `${lead.full_name} is ${lead.status}. No external action was taken.`,
      items: [safeAvaraLead(lead)],
    };
  }

  const stats = buildLeadStats(studioLeads, NOW);
  return {
    ok: true,
    tool: "pipeline_metrics",
    tier,
    answer: `I checked ${stats.summary.totalLeads} lead${stats.summary.totalLeads === 1 ? "" : "s"} in this studio.`,
    metrics: {
      total_leads: stats.summary.totalLeads,
      follow_ups_due: stats.summary.followUpsDue,
      going_cold: stats.summary.goingColdCount,
      missing_info: stats.summary.missingInfoCount,
      import_rows_needing_review: stats.summary.importRowsNeedingReview,
    },
  };
};

describe("no-key pilot readiness harness", () => {
  it("seeds the core no-key entry flows and rejects raw public studio_id intake", () => {
    const fixture = createPilotFixture();
    const studioALeads = forStudio(fixture.leads, STUDIO_A);
    const imported = findStudioLead(fixture, STUDIO_A, LEAD_A_IMPORT);

    expect(validatePublicIntakeSafety({ studio_slug: "atelier-north" })).toEqual({ ok: true, ignored: false });
    expect(validatePublicIntakeSafety({ studio_slug: "atelier-north", studio_id: STUDIO_A })).toMatchObject({
      ok: false,
      status: 400,
    });
    expect(studioALeads.map((lead) => lead.source)).toEqual(
      expect.arrayContaining(["intake_form", "pasted", "manual", "imported"]),
    );
    expect(imported?.custom_fields).toMatchObject({ Designer: "Mira", Instagram: "@ika.home" });
    expect(studioALeads.every((lead) => lead.ai_analysis_status === "not_configured")).toBe(true);
    expect(studioALeads.every((lead) => lead.fit_score == null && lead.classification == null)).toBe(true);
    expect(studioALeads.every((lead) => lead.temperature == null && lead.score_breakdown == null)).toBe(true);
    expect(createNoAIAnalysisResult()).toMatchObject({ status: "not_configured", fit_score: null });
  });

  it("verifies two-studio isolation across pilot data surfaces", () => {
    const fixture = createPilotFixture();
    addNote(fixture, STUDIO_A, LEAD_A_MANUAL, "Internal note for Studio A");
    updateStatus(fixture, STUDIO_A, LEAD_A_MANUAL, "won", USER_A);
    runPilotAvaraTool(fixture, STUDIO_A, chooseAvaraTool("What needs attention today?"));

    expectOnlyStudio(forStudio(fixture.settings, STUDIO_A), STUDIO_A);
    expectOnlyStudio(forStudio(fixture.leads, STUDIO_A), STUDIO_A);
    expectOnlyStudio(forStudio(fixture.activities, STUDIO_A), STUDIO_A);
    expectOnlyStudio(forStudio(fixture.statusHistory, STUDIO_A), STUDIO_A);
    expectOnlyStudio(forStudio(fixture.projects, STUDIO_A), STUDIO_A);
    expectOnlyStudio(forStudio(fixture.agentRuns, STUDIO_A), STUDIO_A);

    expect(findStudioLead(fixture, STUDIO_A, LEAD_B)).toBeUndefined();
    expect(findStudioLead(fixture, STUDIO_B, LEAD_A_MANUAL)).toBeUndefined();
    expect(forStudio(fixture.projects, STUDIO_A).some((project) => project.lead_id === LEAD_B)).toBe(false);
    expect(forStudio(fixture.agentRuns, STUDIO_A).some((run) => run.lead_id === LEAD_B)).toBe(false);
  });

  it("checks Lead Detail notes, reminders, status history, and won-lead project conversion", () => {
    const fixture = createPilotFixture();
    addNote(fixture, STUDIO_A, LEAD_A_MANUAL, "Client prefers a short discovery call.");
    setReminder(fixture, STUDIO_A, LEAD_A_INTAKE, "2026-05-11T09:00:00.000Z");
    updateStatus(fixture, STUDIO_A, LEAD_A_MANUAL, "won", USER_A);

    const stats = buildLeadStats(forStudio(fixture.leads, STUDIO_A), NOW);
    const project = forStudio(fixture.projects, STUDIO_A).find((item) => item.lead_id === LEAD_A_MANUAL);

    expect(forStudio(fixture.activities, STUDIO_A)).toContainEqual(
      expect.objectContaining({ lead_id: LEAD_A_MANUAL, kind: "note" }),
    );
    expect(stats.summary.followUpsDue).toBeGreaterThan(0);
    expect(stats.dueFollowups.map((lead) => lead.id)).toContain(LEAD_A_INTAKE);
    expect(forStudio(fixture.statusHistory, STUDIO_A)).toContainEqual(
      expect.objectContaining({ lead_id: LEAD_A_MANUAL, from_status: "new", to_status: "won" }),
    );
    expect(project).toMatchObject({
      studio_id: STUDIO_A,
      lead_id: LEAD_A_MANUAL,
      client_name: "Maya Manual",
      status: "active",
    });
  });

  it("proves deterministic Foundation signals power Action Queue and Priority Leads", () => {
    const fixture = createPilotFixture();
    const studioALeads = forStudio(fixture.leads, STUDIO_A);
    const stats = buildLeadStats(studioALeads, NOW);
    const actionQueue = buildActionQueueItems(stats);
    const priorityLeads = selectPriorityLeads(studioALeads, NOW, new Set(actionQueue.map((item) => item.id)), 5);

    expect(actionQueue.map((item) => item.kind)).toEqual(
      expect.arrayContaining(["follow_up_due", "needs_review", "missing_info", "possible_duplicate", "import_review"]),
    );
    expect(actionQueue.every((item) => item.tier === ACTION_RISK_TIER.OWNER_VISIBLE)).toBe(true);
    expect(priorityLeads.length).toBeGreaterThan(0);
    expect(priorityLeads.every((lead) => (lead as unknown as PilotLead).studio_id === STUDIO_A)).toBe(true);
  });

  it("checks Avara fixed read-only tools against tenant-scoped deterministic data", () => {
    const fixture = createPilotFixture();
    const prompts = [
      "What needs attention today?",
      "Which leads need follow-up?",
      `Show lead ${LEAD_A_MANUAL}`,
      `Explain score for ${LEAD_A_MANUAL}`,
      "Give me pipeline metrics",
    ];
    const before = JSON.stringify(fixture.leads);

    for (const prompt of prompts) {
      const request = chooseAvaraTool(prompt);
      const response = runPilotAvaraTool(fixture, STUDIO_A, request);
      const text = formatAvaraToolResponse(response);

      expect(["list_action_queue", "query_leads", "get_lead_detail", "explain_score", "pipeline_metrics"]).toContain(
        request.tool,
      );
      expect(response.ok).toBe(true);
      expect(response.tier).toBe(ACTION_RISK_TIER.OWNER_VISIBLE);
      expect(text).toContain("Tier 1 only");
      expect(text).not.toContain("Bela Other Studio");
    }

    const crossTenant = runPilotAvaraTool(fixture, STUDIO_A, { tool: "get_lead_detail", lead_id: LEAD_B });
    expect(crossTenant).toMatchObject({ ok: false, error: "Lead not found in this studio" });
    expect(JSON.stringify(fixture.leads)).toBe(before);
    expect(forStudio(fixture.agentRuns, STUDIO_A).every((run) => run.raw_text == null && run.model === "not_configured")).toBe(true);
    expect(forStudio(fixture.agentRuns, STUDIO_A).every((run) => run.tier <= ACTION_RISK_TIER.OWNER_VISIBLE)).toBe(true);
  });
});
