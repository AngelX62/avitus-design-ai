import {
  ACTION_RISK_TIER,
  isV1FoundationTier,
  type ActionRiskTier,
  type AgentRunStatus,
} from "./actionTiers.ts";
import { recordAgentRun, type AgentRunServiceName, type RecordAgentRunInput } from "./agentRuns.ts";

export const DEFAULT_VERTICAL = "interior_design" as const;
export const DEFAULT_LANGUAGE = "en" as const;
export const DEFAULT_NO_KEY_PROMPT_PACK_VERSION = "v1.0-no-key";
export const DEFAULT_AI_QUALIFICATION_PROMPT_PACK_VERSION = "v1.1-ai-qualification";
export const DEFAULT_LEAD_ANALYSIS_SCHEMA_VERSION = "lead-analysis-v1";

export type AgentVertical = "interior_design" | "real_estate";
export type AgentLanguage = "id" | "en";

export type QualificationProfile = {
  studio_name: string | null;
  ideal_client: string | null;
  target_budget_min: number | null;
  target_budget_max: number | null;
  preferred_project_types: string[];
  preferred_locations: string[];
  signature_styles: string[];
  low_fit_signs: string | null;
};

export type BrandVoice = {
  tone: string;
  language: AgentLanguage;
  signature_phrases: string[];
  prohibited_phrases: string[];
  draft_length_preference: "short" | "medium" | "long";
  emoji_policy: "never" | "sparingly" | "freely";
};

export type AgentOutput = {
  service_name: AgentRunServiceName;
  tier: ActionRiskTier;
  status: AgentRunStatus;
  output: unknown;
};

export type PromptPackMetadata = {
  service_name: AgentRunServiceName;
  version: string;
  release_channel?: string;
  system_prompt: string;
  output_schema_jsonb: Record<string, unknown>;
  examples_jsonb?: unknown[];
  tier_policy_jsonb: Record<string, unknown>;
  model_policy_jsonb: Record<string, unknown>;
  source?: "database" | "fallback";
};

export type AgentContext = {
  studio_id: string;
  vertical: AgentVertical;
  language: AgentLanguage;
  qualification_profile: QualificationProfile;
  brand_voice: BrandVoice;
  currency: string;
  prior_outputs: AgentOutput[];
  schema_version: string;
  prompt_pack_version: string;
  prompt_pack?: PromptPackMetadata;
  run_id: string;
  requested_tier: ActionRiskTier;
};

export type WorkflowResult<T = unknown> = {
  status: AgentRunStatus;
  data?: T;
  error?: string;
};

type StudioSettingsLike = {
  studio_name?: string | null;
  currency?: string | null;
  ideal_client?: string | null;
  target_budget_min?: number | string | null;
  target_budget_max?: number | string | null;
  preferred_project_types?: unknown;
  preferred_locations?: unknown;
  signature_styles?: unknown;
  low_fit_signs?: string | null;
  followup_tone?: string | null;
};

export type BuildAgentContextInput = {
  studio_id: string;
  studio?: StudioSettingsLike | null;
  vertical?: AgentVertical;
  language?: AgentLanguage;
  prior_outputs?: AgentOutput[];
  schema_version?: string;
  prompt_pack_version?: string;
  prompt_pack?: PromptPackMetadata;
  run_id?: string;
  requested_tier?: ActionRiskTier;
};

export class OrchestratorPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrchestratorPolicyError";
  }
}

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];

const toNullableNumber = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === "") return null;
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const makeRunId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `run-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const resolvePromptPackVersion = (aiAvailable: boolean, override?: string) =>
  override ?? (aiAvailable ? DEFAULT_AI_QUALIFICATION_PROMPT_PACK_VERSION : DEFAULT_NO_KEY_PROMPT_PACK_VERSION);

export const assertV1FoundationTier = (tier: ActionRiskTier) => {
  if (!isV1FoundationTier(tier)) {
    throw new OrchestratorPolicyError(`V1 Foundation cannot execute Action Risk Tier ${tier}`);
  }
};

export const assertNoKeyWorkflowTier = (context: Pick<AgentContext, "prompt_pack_version" | "requested_tier">) => {
  if (context.prompt_pack_version === DEFAULT_NO_KEY_PROMPT_PACK_VERSION) {
    assertV1FoundationTier(context.requested_tier);
  }
};

export const buildAgentContext = ({
  studio_id,
  studio = null,
  vertical = DEFAULT_VERTICAL,
  language = DEFAULT_LANGUAGE,
  prior_outputs = [],
  schema_version = DEFAULT_LEAD_ANALYSIS_SCHEMA_VERSION,
  prompt_pack_version = DEFAULT_NO_KEY_PROMPT_PACK_VERSION,
  prompt_pack,
  run_id = makeRunId(),
  requested_tier = ACTION_RISK_TIER.SILENT_INTERNAL,
}: BuildAgentContextInput): AgentContext => {
  const resolvedPromptPackVersion = prompt_pack?.version ?? prompt_pack_version;
  const context: AgentContext = {
    studio_id,
    vertical,
    language,
    qualification_profile: {
      studio_name: studio?.studio_name ?? null,
      ideal_client: studio?.ideal_client ?? null,
      target_budget_min: toNullableNumber(studio?.target_budget_min),
      target_budget_max: toNullableNumber(studio?.target_budget_max),
      preferred_project_types: toStringArray(studio?.preferred_project_types),
      preferred_locations: toStringArray(studio?.preferred_locations),
      signature_styles: toStringArray(studio?.signature_styles),
      low_fit_signs: studio?.low_fit_signs ?? null,
    },
    brand_voice: {
      tone: studio?.followup_tone ?? "warm",
      language,
      signature_phrases: [],
      prohibited_phrases: [],
      draft_length_preference: "medium",
      emoji_policy: "sparingly",
    },
    currency: studio?.currency || "USD",
    prior_outputs,
    schema_version,
    prompt_pack_version: resolvedPromptPackVersion,
    prompt_pack,
    run_id,
    requested_tier,
  };

  assertNoKeyWorkflowTier(context);
  return context;
};

export const describeAgentContextForLeadIntelligence = (context: AgentContext) => {
  const profile = context.qualification_profile;

  return `Studio: ${profile.studio_name || "n/a"}.
Currency: ${context.currency}.
Vertical: ${context.vertical}.
Ideal client: ${profile.ideal_client || "n/a"}.
Target budget: ${context.currency} ${profile.target_budget_min ?? 0}-${profile.target_budget_max ?? 0}.
Preferred project types: ${profile.preferred_project_types.join(", ") || "any"}.
Preferred locations: ${profile.preferred_locations.join(", ") || "any"}.
Signature styles: ${profile.signature_styles.join(", ") || "n/a"}.
Low-fit warning signs: ${profile.low_fit_signs || "n/a"}.
Follow-up tone: ${context.brand_voice.tone}.`;
};

export const recordWorkflowAgentRun = async (
  supabase: Parameters<typeof recordAgentRun>[0],
  context: AgentContext,
  input: Omit<RecordAgentRunInput, "studio_id" | "prompt_pack_version" | "schema_version" | "tier"> & {
    tier?: ActionRiskTier;
    prompt_pack_version?: string;
    schema_version?: string;
  },
) => {
  const tier = input.tier ?? context.requested_tier;
  const promptPackVersion = input.prompt_pack_version ?? context.prompt_pack_version;
  const runContext = { ...context, prompt_pack_version: promptPackVersion, requested_tier: tier };
  assertNoKeyWorkflowTier(runContext);

  await recordAgentRun(supabase, {
    ...input,
    run_id: input.run_id ?? context.run_id,
    studio_id: context.studio_id,
    prompt_pack_version: promptPackVersion,
    schema_version: input.schema_version ?? context.schema_version,
    tier,
  });
};
