import { supabase } from "@/integrations/supabase/client";

export type AvaraSignalKey =
  | "follow_ups_due"
  | "going_cold"
  | "needs_review"
  | "missing_info"
  | "duplicates"
  | "status_health"
  | "import_rows";

export type AvaraToolName =
  | "pipeline_metrics"
  | "query_leads"
  | "get_lead_detail"
  | "explain_score"
  | "list_action_queue";

export type AvaraToolRequest = {
  tool: AvaraToolName;
  signal?: AvaraSignalKey;
  lead_id?: string;
  limit?: number;
};

export type AvaraActionQueueItem = {
  id: string;
  kind: string;
  tier: number;
  title: string;
  reason: string;
  suggestedAction: string;
  href?: string;
};

export type AvaraToolResponse = {
  ok?: boolean;
  tool?: AvaraToolName;
  tier?: number;
  answer?: string;
  items?: Array<{
    id: string;
    full_name: string;
    status: string;
    source: string | null;
    fit_score: number | null;
    classification: string | null;
    project_type: string | null;
    budget_range: string | null;
    timeline: string | null;
    location: string | null;
    missing_fields?: string[];
  }>;
  action_items?: AvaraActionQueueItem[];
  metrics?: Record<string, number>;
  error?: string;
};

const UUID_RE = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;

export const chooseAvaraTool = (prompt: string): AvaraToolRequest => {
  const lower = prompt.toLowerCase();
  const leadId = prompt.match(UUID_RE)?.[0];

  if (leadId && lower.includes("score")) return { tool: "explain_score", lead_id: leadId };
  if (leadId) return { tool: "get_lead_detail", lead_id: leadId };

  if (lower.includes("follow-up") || lower.includes("follow up") || lower.includes("reminder")) {
    return { tool: "query_leads", signal: "follow_ups_due", limit: 8 };
  }
  if (lower.includes("cold") || lower.includes("stale")) {
    return { tool: "query_leads", signal: "going_cold", limit: 8 };
  }
  if (lower.includes("missing")) {
    return { tool: "query_leads", signal: "missing_info", limit: 8 };
  }
  if (lower.includes("duplicate")) {
    return { tool: "query_leads", signal: "duplicates", limit: 8 };
  }
  if (lower.includes("import")) {
    return { tool: "query_leads", signal: "import_rows", limit: 8 };
  }
  if (lower.includes("review")) {
    return { tool: "query_leads", signal: "needs_review", limit: 8 };
  }
  if (
    lower.includes("action queue") ||
    lower.includes("needs attention") ||
    lower.includes("attention today") ||
    lower.includes("today's priorities") ||
    lower.includes("todays priorities") ||
    lower.includes("priority")
  ) {
    return { tool: "list_action_queue", limit: 8 };
  }

  return { tool: "pipeline_metrics" };
};

export const formatAvaraToolResponse = (response: AvaraToolResponse) => {
  const lines = [response.answer || "Avara checked the studio pipeline."];

  if (response.items?.length) {
    lines.push("");
    lines.push(
      ...response.items.slice(0, 5).map((lead) => {
        const fields = [
          lead.status,
          lead.project_type,
          lead.location,
          lead.budget_range,
          lead.missing_fields?.length ? `missing ${lead.missing_fields.join(", ")}` : null,
        ].filter(Boolean);
        return `- ${lead.full_name}: ${fields.join(" · ")}`;
      }),
    );
  }

  if (response.action_items?.length) {
    lines.push("");
    lines.push(
      ...response.action_items.slice(0, 5).map((item) => {
        return `- ${item.title}: ${item.reason} Next step: ${item.suggestedAction}`;
      }),
    );
  }

  lines.push("");
  lines.push("Tier 1 only: no message was sent, no record was changed, and no external action was taken.");

  return lines.join("\n");
};

export const runAvaraTool = async (studioId: string, prompt: string) => {
  const request = chooseAvaraTool(prompt);
  const { data, error } = await supabase.functions.invoke("avara-tools", {
    body: {
      studio_id: studioId,
      ...request,
    },
  });

  if (error) throw new Error(error.message || "Avara tool failed");
  const response = data as AvaraToolResponse;
  if (!response?.ok) throw new Error(response?.error || "Avara tool failed");
  return formatAvaraToolResponse(response);
};
