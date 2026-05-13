export const ACTION_RISK_TIER = {
  SILENT_INTERNAL: 0,
  OWNER_VISIBLE: 1,
  PREPARED_DRAFT: 2,
  EXTERNAL_ACTION: 3,
  RESTRICTED_BULK: 4,
} as const;

export const ACTION_RISK_TIERS = [0, 1, 2, 3, 4] as const;

export type ActionRiskTier = (typeof ACTION_RISK_TIERS)[number];

export const V1_FOUNDATION_ALLOWED_TIERS = [
  ACTION_RISK_TIER.SILENT_INTERNAL,
  ACTION_RISK_TIER.OWNER_VISIBLE,
] as const;

export type V1FoundationActionRiskTier = (typeof V1_FOUNDATION_ALLOWED_TIERS)[number];

export const AGENT_RUN_STATUSES = ["success", "partial", "failed"] as const;

export type AgentRunStatus = (typeof AGENT_RUN_STATUSES)[number];

export const isV1FoundationTier = (value: unknown): value is V1FoundationActionRiskTier =>
  typeof value === "number" && V1_FOUNDATION_ALLOWED_TIERS.includes(value as V1FoundationActionRiskTier);
