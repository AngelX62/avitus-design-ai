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

export const ACTION_RISK_TIER_LABELS: Record<ActionRiskTier, string> = {
  0: "Tier 0",
  1: "Tier 1",
  2: "Tier 2",
  3: "Tier 3",
  4: "Tier 4",
};

export const ACTION_RISK_TIER_DESCRIPTIONS: Record<ActionRiskTier, string> = {
  0: "Silent internal recordkeeping",
  1: "Owner-visible recommendation",
  2: "Prepared draft for owner approval",
  3: "External action after approval",
  4: "Restricted bulk or high-impact action",
};

export const AGENT_RUN_STATUSES = ["success", "partial", "failed"] as const;

export type AgentRunStatus = (typeof AGENT_RUN_STATUSES)[number];

export const isActionRiskTier = (value: unknown): value is ActionRiskTier =>
  typeof value === "number" && ACTION_RISK_TIERS.includes(value as ActionRiskTier);

export const isV1FoundationTier = (value: unknown): value is V1FoundationActionRiskTier =>
  typeof value === "number" && V1_FOUNDATION_ALLOWED_TIERS.includes(value as V1FoundationActionRiskTier);

export const requiresOwnerApproval = (tier: ActionRiskTier) => tier >= ACTION_RISK_TIER.PREPARED_DRAFT;
