import { ACTION_RISK_TIER, type ActionRiskTier, type AgentRunStatus } from "./actionTiers.ts";

export type AgentRunServiceName =
  | "lead_intelligence"
  | "communication_drafting"
  | "pipeline_signals"
  | "reporting"
  | "integration_payloads";

export type RecordAgentRunInput = {
  run_id?: string;
  studio_id: string;
  lead_id?: string | null;
  agent_name: string;
  service_name?: AgentRunServiceName;
  model?: string | null;
  prompt_pack_version?: string;
  schema_version?: string;
  input?: unknown;
  structured_output_jsonb?: unknown;
  raw_text?: string | null;
  tier?: ActionRiskTier;
  status?: AgentRunStatus;
  confidence?: number | null;
  latency_ms?: number;
  prompt_tokens?: number;
  completion_tokens?: number;
  cost_usd?: number;
  created_by?: string | null;
};

const sha256Hex = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

export const hashAgentInput = async (input: unknown) => sha256Hex(JSON.stringify(input ?? null));

export const recordAgentRun = async (
  supabase: { from: (table: "agent_runs") => { insert: (values: Record<string, unknown>) => Promise<{ error: unknown }> } },
  input: RecordAgentRunInput,
) => {
  const values: Record<string, unknown> = {
    studio_id: input.studio_id,
    lead_id: input.lead_id ?? null,
    agent_name: input.agent_name,
    service_name: input.service_name ?? "lead_intelligence",
    model: input.model ?? null,
    prompt_pack_version: input.prompt_pack_version ?? "v1.0-no-key",
    schema_version: input.schema_version ?? "lead-analysis-v1",
    input_hash: input.input === undefined ? null : await hashAgentInput(input.input),
    structured_output_jsonb: input.structured_output_jsonb ?? {},
    raw_text: input.raw_text ?? null,
    tier: input.tier ?? ACTION_RISK_TIER.SILENT_INTERNAL,
    status: input.status ?? "success",
    confidence: input.confidence ?? null,
    latency_ms: input.latency_ms ?? 0,
    prompt_tokens: input.prompt_tokens ?? 0,
    completion_tokens: input.completion_tokens ?? 0,
    cost_usd: input.cost_usd ?? 0,
    created_by: input.created_by ?? null,
  };

  if (input.run_id) values.run_id = input.run_id;

  const { error } = await supabase.from("agent_runs").insert(values);

  if (error) throw error;
};
