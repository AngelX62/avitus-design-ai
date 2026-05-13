import { z } from "https://esm.sh/zod@3.25.76";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { ACTION_RISK_TIER } from "../_shared/actionTiers.ts";
import { buildAgentContext, recordWorkflowAgentRun } from "../_shared/orchestrator.ts";
import { adminClient, HttpError, requireStudioMember, requireUser, safeError } from "../_shared/security.ts";

const avaraToolSchema = z.object({
  studio_id: z.string().uuid(),
  tool: z.enum([
    "pipeline_metrics",
    "query_leads",
    "get_lead_detail",
    "explain_score",
    "list_action_queue",
  ]),
  lead_id: z.string().uuid().optional(),
  signal: z.enum(["follow_ups_due", "going_cold", "needs_review", "missing_info", "duplicates", "status_health", "import_rows"]).optional(),
  limit: z.number().int().min(1).max(25).optional().default(8),
});

type AvaraToolPayload = z.infer<typeof avaraToolSchema>;

type LeadRow = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  source: string | null;
  classification: string | null;
  fit_score: number | null;
  ai_next_action: string | null;
  ai_summary: string | null;
  ai_analysis_status: string | null;
  ai_analysis_error: string | null;
  project_type: string | null;
  property_type: string | null;
  budget_range: string | null;
  timeline: string | null;
  location: string | null;
  score_breakdown: unknown;
  missing_info: string[] | null;
  reminder_at: string | null;
  last_contacted_at: string | null;
  created_at: string;
};

type ActionQueueItemKind =
  | "follow_up_due"
  | "going_cold"
  | "needs_review"
  | "missing_info"
  | "possible_duplicate"
  | "import_review"
  | "status_health";

type ActionQueueItem = {
  id: string;
  kind: ActionQueueItemKind;
  tier: number;
  title: string;
  reason: string;
  suggestedAction: string;
  href?: string;
};

const openStatuses = new Set(["new", "needs_review", "high_fit", "contacted", "consultation_booked"]);

const isPlaceholderEmail = (email?: string | null) =>
  Boolean(email && /^unknown\+[^@]+@(intake|import|manual|pasted)\.avitus$/i.test(email.trim()));

const hasUsableContact = (lead: Pick<LeadRow, "email" | "phone">) =>
  Boolean(lead.phone?.trim()) || Boolean(lead.email?.trim() && !isPlaceholderEmail(lead.email));

const missingFields = (lead: LeadRow) => {
  const missing: string[] = [];
  if (!hasUsableContact(lead)) missing.push("contact");
  if (!lead.budget_range?.trim()) missing.push("budget");
  if (!lead.timeline?.trim()) missing.push("timeline");
  if (!lead.project_type?.trim() && !lead.property_type?.trim()) missing.push("scope");
  if (!lead.location?.trim()) missing.push("location");
  return missing;
};

const duplicateKeyForLead = (lead: LeadRow) => {
  const email = lead.email?.trim().toLowerCase();
  if (email && !isPlaceholderEmail(email)) return `email:${email}`;
  const phoneDigits = lead.phone?.replace(/\D/g, "");
  if (phoneDigits && phoneDigits.length >= 6) return `phone:${phoneDigits}`;
  const name = lead.full_name?.trim().toLowerCase().replace(/\s+/g, " ");
  const location = lead.location?.trim().toLowerCase().replace(/\s+/g, " ");
  if (name && location) return `name-location:${name}|${location}`;
  return null;
};

const leadAgeDays = (iso: string, now: Date) => {
  const time = new Date(iso).getTime();
  if (!Number.isFinite(time)) return 0;
  return Math.floor((now.getTime() - time) / 86_400_000);
};

const isDue = (lead: LeadRow, now: Date) => {
  if (!lead.reminder_at) return false;
  const due = new Date(lead.reminder_at).getTime();
  return Number.isFinite(due) && due <= now.getTime();
};

const isGoingCold = (lead: LeadRow, now: Date) => {
  if (!lead.last_contacted_at || !openStatuses.has(lead.status)) return false;
  const last = new Date(lead.last_contacted_at).getTime();
  return Number.isFinite(last) && now.getTime() - last > 14 * 86_400_000;
};

const hasNoFirstFollowUpRisk = (lead: LeadRow, now: Date) =>
  openStatuses.has(lead.status) && !lead.last_contacted_at && leadAgeDays(lead.created_at, now) >= 7;

const safeLead = (lead: LeadRow) => ({
  id: lead.id,
  full_name: lead.full_name,
  status: lead.status,
  source: lead.source,
  classification: lead.classification,
  fit_score: lead.fit_score,
  project_type: lead.project_type,
  property_type: lead.property_type,
  budget_range: lead.budget_range,
  timeline: lead.timeline,
  location: lead.location,
  reminder_at: lead.reminder_at,
  last_contacted_at: lead.last_contacted_at,
  created_at: lead.created_at,
  missing_fields: missingFields(lead),
  ai_analysis_status: lead.ai_analysis_status,
});

const loadLeads = async (supabase: ReturnType<typeof adminClient>, studioId: string) => {
  const { data, error } = await supabase
    .from("leads")
    .select("id, full_name, email, phone, status, source, classification, fit_score, ai_next_action, ai_summary, ai_analysis_status, ai_analysis_error, project_type, property_type, budget_range, timeline, location, score_breakdown, missing_info, reminder_at, last_contacted_at, created_at")
    .eq("studio_id", studioId)
    .order("created_at", { ascending: false })
    .limit(250);

  if (error) throw new HttpError(500, "Could not load studio leads");
  return (data ?? []) as LeadRow[];
};

const duplicateKeys = (leads: LeadRow[]) => {
  const counts = new Map<string, number>();
  for (const lead of leads) {
    const key = duplicateKeyForLead(lead);
    if (key) counts.set(key, (counts.get(key) || 0) + 1);
  }
  return new Set(Array.from(counts.entries()).filter(([, count]) => count > 1).map(([key]) => key));
};

const duplicateGroups = (leads: LeadRow[]) => {
  const groups = new Map<string, LeadRow[]>();
  for (const lead of leads) {
    const key = duplicateKeyForLead(lead);
    if (!key) continue;
    groups.set(key, [...(groups.get(key) ?? []), lead]);
  }
  return Array.from(groups.entries()).filter(([, group]) => group.length > 1);
};

const duplicateLabel = (key: string) => {
  if (key.startsWith("email:")) return "Same email";
  if (key.startsWith("phone:")) return "Same phone";
  return "Same name and location";
};

const filterLeads = (leads: LeadRow[], signal: AvaraToolPayload["signal"], now: Date) => {
  if (!signal) return leads;
  const duplicateSet = duplicateKeys(leads);
  return leads.filter((lead) => {
    if (signal === "follow_ups_due") return isDue(lead, now);
    if (signal === "going_cold") return isGoingCold(lead, now);
    if (signal === "needs_review") return lead.status === "needs_review" || lead.classification === "needs_review";
    if (signal === "missing_info") return openStatuses.has(lead.status) && missingFields(lead).length > 0;
    if (signal === "duplicates") {
      const key = duplicateKeyForLead(lead);
      return Boolean(key && duplicateSet.has(key));
    }
    if (signal === "status_health") return hasNoFirstFollowUpRisk(lead, now);
    if (signal === "import_rows") return lead.source === "imported" && lead.status === "new";
    return false;
  });
};

const buildMetrics = (leads: LeadRow[], now: Date) => {
  const duplicateSet = duplicateKeys(leads);
  const metrics = {
    total_leads: leads.length,
    follow_ups_due: 0,
    going_cold: 0,
    needs_review: 0,
    missing_info: 0,
    duplicate_leads: 0,
    import_rows_needing_review: 0,
    no_first_follow_up_7d: 0,
  };

  for (const lead of leads) {
    if (isDue(lead, now)) metrics.follow_ups_due += 1;
    if (isGoingCold(lead, now)) metrics.going_cold += 1;
    if (lead.status === "needs_review" || lead.classification === "needs_review") metrics.needs_review += 1;
    if (openStatuses.has(lead.status) && missingFields(lead).length > 0) metrics.missing_info += 1;
    if (lead.source === "imported" && lead.status === "new") metrics.import_rows_needing_review += 1;
    if (hasNoFirstFollowUpRisk(lead, now)) metrics.no_first_follow_up_7d += 1;
    const duplicateKey = duplicateKeyForLead(lead);
    if (duplicateKey && duplicateSet.has(duplicateKey)) metrics.duplicate_leads += 1;
  }

  return metrics;
};

const buildActionQueueItems = (leads: LeadRow[], now: Date, limit: number) => {
  const metrics = buildMetrics(leads, now);
  const groups = duplicateGroups(leads);
  const items: ActionQueueItem[] = [];
  const dueFollowups = leads
    .filter((lead) => isDue(lead, now))
    .sort((a, b) => new Date(a.reminder_at ?? 0).getTime() - new Date(b.reminder_at ?? 0).getTime());

  for (const lead of dueFollowups.slice(0, 3)) {
    items.push({
      id: `follow-up-${lead.id}`,
      kind: "follow_up_due",
      tier: ACTION_RISK_TIER.OWNER_VISIBLE,
      title: `Follow up with ${lead.full_name}`,
      reason: "Reminder is overdue for this lead.",
      suggestedAction: "Open the lead, review context, then decide the next manual follow-up.",
      href: `/leads/${lead.id}`,
    });
  }

  if (metrics.going_cold > 0) {
    items.push({
      id: "going-cold-signal",
      kind: "going_cold",
      tier: ACTION_RISK_TIER.OWNER_VISIBLE,
      title: `${metrics.going_cold} open lead${metrics.going_cold === 1 ? "" : "s"} with no contact in 14+ days`,
      reason: "These leads have not been contacted recently.",
      suggestedAction: "Open the Going cold filter and decide which leads are worth saving.",
      href: "/leads?signal=going_cold",
    });
  }

  if (metrics.no_first_follow_up_7d > 0) {
    items.push({
      id: "no-follow-up-risk",
      kind: "status_health",
      tier: ACTION_RISK_TIER.OWNER_VISIBLE,
      title: `${metrics.no_first_follow_up_7d} lead${metrics.no_first_follow_up_7d === 1 ? "" : "s"} with no follow-up in 7+ days`,
      reason: "These leads are open and have no recorded first touch. This is a deterministic revenue-risk signal.",
      suggestedAction: "Open the no-follow-up filter and choose who needs a manual touch today.",
      href: "/leads?signal=status_health",
    });
  }

  if (metrics.needs_review > 0) {
    items.push({
      id: "needs-review",
      kind: "needs_review",
      tier: ACTION_RISK_TIER.OWNER_VISIBLE,
      title: `${metrics.needs_review} lead${metrics.needs_review === 1 ? "" : "s"} waiting for qualification`,
      reason: "These leads need owner review before confident prioritization.",
      suggestedAction: "Open the Needs review filter in the Lead Inbox.",
      href: "/leads?signal=needs_review",
    });
  }

  if (metrics.missing_info > 0) {
    items.push({
      id: "missing-info",
      kind: "missing_info",
      tier: ACTION_RISK_TIER.OWNER_VISIBLE,
      title: `${metrics.missing_info} lead${metrics.missing_info === 1 ? "" : "s"} missing qualification info`,
      reason: "At least one key Foundation field is missing: contact, budget, timeline, scope, or location.",
      suggestedAction: "Open the Missing info filter and fill the fields that block qualification.",
      href: "/leads?signal=missing_info",
    });
  }

  if (groups.length > 0) {
    const [key, group] = groups[0];
    items.push({
      id: "possible-duplicates",
      kind: "possible_duplicate",
      tier: ACTION_RISK_TIER.OWNER_VISIBLE,
      title: `${groups.length} possible duplicate group${groups.length === 1 ? "" : "s"}`,
      reason: `${duplicateLabel(key)}: ${group.map((lead) => lead.full_name).slice(0, 3).join(", ")}. Review before merging or overwriting anything.`,
      suggestedAction: "Open the Duplicates filter and compare the lead records manually.",
      href: "/leads?signal=duplicates",
    });
  }

  if (metrics.import_rows_needing_review > 0) {
    items.push({
      id: "import-review",
      kind: "import_review",
      tier: ACTION_RISK_TIER.OWNER_VISIBLE,
      title: `${metrics.import_rows_needing_review} imported row${metrics.import_rows_needing_review === 1 ? "" : "s"} need review`,
      reason: "Imported leads are saved, but the owner still needs to confirm the mapped fields and next step.",
      suggestedAction: "Open the Import rows filter and clean the highest-value rows first.",
      href: "/leads?signal=import_rows",
    });
  }

  return items.slice(0, limit);
};

const answerForMetrics = (metrics: ReturnType<typeof buildMetrics>) => {
  const attention = [
    metrics.follow_ups_due ? `${metrics.follow_ups_due} follow-up${metrics.follow_ups_due === 1 ? "" : "s"} due` : null,
    metrics.no_first_follow_up_7d ? `${metrics.no_first_follow_up_7d} lead${metrics.no_first_follow_up_7d === 1 ? "" : "s"} with no first follow-up in 7+ days` : null,
    metrics.going_cold ? `${metrics.going_cold} lead${metrics.going_cold === 1 ? "" : "s"} going cold` : null,
    metrics.missing_info ? `${metrics.missing_info} lead${metrics.missing_info === 1 ? "" : "s"} missing qualification info` : null,
    metrics.duplicate_leads ? `${metrics.duplicate_leads} possible duplicate lead${metrics.duplicate_leads === 1 ? "" : "s"}` : null,
    metrics.import_rows_needing_review ? `${metrics.import_rows_needing_review} imported row${metrics.import_rows_needing_review === 1 ? "" : "s"} needing review` : null,
  ].filter(Boolean);

  if (!attention.length) {
    return `I checked ${metrics.total_leads} lead${metrics.total_leads === 1 ? "" : "s"} in this studio. No urgent Foundation signals are waiting. No external action was taken.`;
  }

  return `I checked ${metrics.total_leads} lead${metrics.total_leads === 1 ? "" : "s"} in this studio. Attention today: ${attention.join("; ")}. These are deterministic Foundation signals only, and no external action was taken.`;
};

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  let context: ReturnType<typeof buildAgentContext> | null = null;
  let payload: AvaraToolPayload | null = null;
  const startedAt = Date.now();

  try {
    payload = avaraToolSchema.parse(await req.json());
    const user = await requireUser(req);
    const supabase = adminClient();
    await requireStudioMember(supabase, payload.studio_id, user.id);

    context = buildAgentContext({
      studio_id: payload.studio_id,
      schema_version: "avara-tools-v1",
      requested_tier: ACTION_RISK_TIER.OWNER_VISIBLE,
    });

    const now = new Date();
    const leads = await loadLeads(supabase, payload.studio_id);
    let body: Record<string, unknown>;

    if (payload.tool === "pipeline_metrics") {
      const metrics = buildMetrics(leads, now);
      body = {
        ok: true,
        tool: payload.tool,
        tier: ACTION_RISK_TIER.OWNER_VISIBLE,
        answer: answerForMetrics(metrics),
        metrics,
      };
    } else if (payload.tool === "list_action_queue") {
      const actionItems = buildActionQueueItems(leads, now, payload.limit);
      body = {
        ok: true,
        tool: payload.tool,
        tier: ACTION_RISK_TIER.OWNER_VISIBLE,
        answer: actionItems.length
          ? `I found ${actionItems.length} Action Queue item${actionItems.length === 1 ? "" : "s"} from deterministic Foundation signals. Open the linked records before taking action.`
          : "No urgent Action Queue items are waiting from deterministic Foundation signals right now.",
        action_items: actionItems,
      };
    } else if (payload.tool === "query_leads") {
      const matches = filterLeads(leads, payload.signal, now).slice(0, payload.limit).map(safeLead);
      body = {
        ok: true,
        tool: payload.tool,
        tier: ACTION_RISK_TIER.OWNER_VISIBLE,
        answer: matches.length
          ? `I found ${matches.length} lead${matches.length === 1 ? "" : "s"} for ${payload.signal ?? "this query"}. Open the linked records before taking action.`
          : `I did not find leads for ${payload.signal ?? "this query"} right now.`,
        items: matches,
      };
    } else {
      if (!payload.lead_id) throw new HttpError(400, "lead_id is required for this Avara tool");
      const lead = leads.find((candidate) => candidate.id === payload.lead_id);
      if (!lead) throw new HttpError(404, "Lead not found in this studio");

      if (payload.tool === "get_lead_detail") {
        body = {
          ok: true,
          tool: payload.tool,
          tier: ACTION_RISK_TIER.OWNER_VISIBLE,
          answer: `${lead.full_name} is ${lead.status}. Missing fields: ${missingFields(lead).join(", ") || "none"}. No external action was taken.`,
          lead: safeLead(lead),
        };
      } else {
        body = {
          ok: true,
          tool: payload.tool,
          tier: ACTION_RISK_TIER.OWNER_VISIBLE,
          answer: lead.fit_score == null
            ? `${lead.full_name} does not have an AI score yet. The lead remains in manual review mode; no fake score was generated.`
            : `${lead.full_name} is scored ${lead.fit_score} and classified ${lead.classification ?? "unclassified"}. Review the score breakdown in Lead Detail before acting.`,
          score_breakdown: lead.score_breakdown,
          missing_info: lead.missing_info ?? missingFields(lead),
        };
      }
    }

    await recordWorkflowAgentRun(supabase, context, {
      agent_name: "Avara Toolbelt",
      service_name: payload.tool === "pipeline_metrics"
        ? "reporting"
        : payload.tool === "list_action_queue"
          ? "pipeline_signals"
          : "lead_intelligence",
      model: "not_configured",
      input: { tool: payload.tool, signal: payload.signal ?? null },
      structured_output_jsonb: {
        tool: payload.tool,
        signal: payload.signal ?? null,
        result_count: Array.isArray(body.items)
          ? body.items.length
          : Array.isArray(body.action_items)
            ? body.action_items.length
            : body.lead
              ? 1
              : 0,
      },
      tier: ACTION_RISK_TIER.OWNER_VISIBLE,
      status: "success",
      latency_ms: Date.now() - startedAt,
      created_by: user.id,
    }).catch(() => null);

    return jsonResponse(req, body);
  } catch (error) {
    const { status, message } = safeError(error);
    return jsonResponse(req, { ok: false, error: message }, status);
  }
});
