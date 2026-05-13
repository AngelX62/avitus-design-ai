import { describe, expect, it } from "vitest";
import {
  ACTION_RISK_TIER,
  ACTION_RISK_TIERS,
  AGENT_RUN_STATUSES,
  V1_FOUNDATION_ALLOWED_TIERS,
  isActionRiskTier,
  isV1FoundationTier,
  requiresOwnerApproval,
} from "@/lib/actionTiers";

describe("action risk tiers", () => {
  it("defines the canonical tier range from 0 through 4", () => {
    expect(ACTION_RISK_TIERS).toEqual([0, 1, 2, 3, 4]);
    expect(isActionRiskTier(0)).toBe(true);
    expect(isActionRiskTier(4)).toBe(true);
    expect(isActionRiskTier(5)).toBe(false);
  });

  it("allows only Tier 0 and Tier 1 in the V1.0 foundation spine", () => {
    expect(V1_FOUNDATION_ALLOWED_TIERS).toEqual([
      ACTION_RISK_TIER.SILENT_INTERNAL,
      ACTION_RISK_TIER.OWNER_VISIBLE,
    ]);
    expect(isV1FoundationTier(ACTION_RISK_TIER.SILENT_INTERNAL)).toBe(true);
    expect(isV1FoundationTier(ACTION_RISK_TIER.OWNER_VISIBLE)).toBe(true);
    expect(isV1FoundationTier(ACTION_RISK_TIER.PREPARED_DRAFT)).toBe(false);
    expect(isV1FoundationTier(ACTION_RISK_TIER.EXTERNAL_ACTION)).toBe(false);
    expect(isV1FoundationTier(ACTION_RISK_TIER.RESTRICTED_BULK)).toBe(false);
  });

  it("marks Tier 2 and above as requiring owner approval", () => {
    expect(requiresOwnerApproval(ACTION_RISK_TIER.SILENT_INTERNAL)).toBe(false);
    expect(requiresOwnerApproval(ACTION_RISK_TIER.OWNER_VISIBLE)).toBe(false);
    expect(requiresOwnerApproval(ACTION_RISK_TIER.PREPARED_DRAFT)).toBe(true);
    expect(requiresOwnerApproval(ACTION_RISK_TIER.EXTERNAL_ACTION)).toBe(true);
    expect(requiresOwnerApproval(ACTION_RISK_TIER.RESTRICTED_BULK)).toBe(true);
  });

  it("keeps agent run statuses bounded", () => {
    expect(AGENT_RUN_STATUSES).toEqual(["success", "partial", "failed"]);
  });
});
