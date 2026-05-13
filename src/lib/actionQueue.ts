import {
  ACTION_RISK_TIER,
  type ActionRiskTier,
} from "@/lib/actionTiers";
import { formatRelative } from "@/lib/format";
import type { LeadStats } from "@/lib/leadStats";

export type ActionQueueItemKind =
  | "follow_up_due"
  | "going_cold"
  | "needs_review"
  | "missing_info"
  | "possible_duplicate"
  | "import_review"
  | "status_health"
  | "low_season";

export type ActionQueueItem = {
  id: string;
  kind: ActionQueueItemKind;
  tier: ActionRiskTier;
  title: string;
  reason: string;
  suggestedAction: string;
  href?: string;
};

export const buildActionQueueItems = (stats: LeadStats): ActionQueueItem[] => {
  const items: ActionQueueItem[] = [];

  for (const lead of stats.dueFollowups.slice(0, 3)) {
    const reminderText = lead.reminder_at
      ? `Reminder set ${formatRelative(lead.reminder_at)} — this lead is overdue.`
      : "Reminder is overdue for this lead.";
    items.push({
      id: `follow-up-${lead.id}`,
      kind: "follow_up_due",
      tier: ACTION_RISK_TIER.OWNER_VISIBLE,
      title: `Follow up with ${lead.full_name}`,
      reason: reminderText,
      suggestedAction: "Open the lead, review context, then copy or edit the follow-up draft.",
      href: `/leads/${lead.id}`,
    });
  }

  const goingColdCount = stats.summary.goingColdCount;
  if (goingColdCount > 0) {
    items.push({
      id: "going-cold-signal",
      kind: "going_cold",
      tier: ACTION_RISK_TIER.OWNER_VISIBLE,
      title: `${goingColdCount} open lead${goingColdCount === 1 ? "" : "s"} with no contact in 14+ days`,
      reason: "These leads have not been contacted recently. Review and decide if any are worth a touch.",
      suggestedAction: "Open the Going cold filter in the Lead Inbox.",
      href: "/leads?signal=going_cold",
    });
  }

  const noFollowUpRiskCount = stats.summary.noFollowUpRiskCount;
  if (noFollowUpRiskCount > 0) {
    items.push({
      id: "no-follow-up-risk",
      kind: "status_health",
      tier: ACTION_RISK_TIER.OWNER_VISIBLE,
      title: `${noFollowUpRiskCount} lead${noFollowUpRiskCount === 1 ? "" : "s"} with no follow-up in 7+ days`,
      reason: "These leads are open and have no recorded first touch. This is a revenue-risk signal, not an AI score.",
      suggestedAction: "Open the no-follow-up filter and decide who needs a manual touch today.",
      href: "/leads?signal=status_health",
    });
  }

  const needsReviewCount = stats.statusRows.find((row) => row.key === "needs_review")?.count ?? 0;
  if (needsReviewCount > 0) {
    items.push({
      id: "needs-review",
      kind: "needs_review",
      tier: ACTION_RISK_TIER.OWNER_VISIBLE,
      title: `${needsReviewCount} lead${needsReviewCount === 1 ? "" : "s"} waiting for qualification`,
      reason: "These leads don't have enough clean information for confident prioritization.",
      suggestedAction: "Open the Needs review filter in the Lead Inbox.",
      href: "/leads?signal=needs_review",
    });
  }

  if (stats.summary.missingInfoCount > 0) {
    items.push({
      id: "missing-info",
      kind: "missing_info",
      tier: ACTION_RISK_TIER.OWNER_VISIBLE,
      title: `${stats.summary.missingInfoCount} lead${stats.summary.missingInfoCount === 1 ? "" : "s"} missing qualification info`,
      reason: "At least one key Foundation field is missing: contact, budget, timeline, scope, or location.",
      suggestedAction: "Open the Missing info filter and fill the fields that block qualification.",
      href: "/leads?signal=missing_info",
    });
  }

  if (stats.summary.possibleDuplicateGroups > 0) {
    const firstGroup = stats.duplicateGroups[0];
    items.push({
      id: "possible-duplicates",
      kind: "possible_duplicate",
      tier: ACTION_RISK_TIER.OWNER_VISIBLE,
      title: `${stats.summary.possibleDuplicateGroups} possible duplicate group${stats.summary.possibleDuplicateGroups === 1 ? "" : "s"}`,
      reason: firstGroup
        ? `${firstGroup.label}: ${firstGroup.names.slice(0, 3).join(", ")}. Review before merging or overwriting anything.`
        : "Review duplicate-looking leads before changing records.",
      suggestedAction: "Open the Duplicates filter and compare the lead records manually.",
      href: "/leads?signal=duplicates",
    });
  }

  if (stats.summary.importRowsNeedingReview > 0) {
    items.push({
      id: "import-review",
      kind: "import_review",
      tier: ACTION_RISK_TIER.OWNER_VISIBLE,
      title: `${stats.summary.importRowsNeedingReview} imported row${stats.summary.importRowsNeedingReview === 1 ? "" : "s"} need review`,
      reason: "Imported leads are saved, but the owner still needs to confirm the mapped fields and next step.",
      suggestedAction: "Open the Import rows filter and clean the highest-value rows first.",
      href: "/leads?signal=import_rows",
    });
  }

  if (stats.seasonality.status === "low_season") {
    const { recent_count, baseline_count } = stats.seasonality;
    items.push({
      id: "low-season-signal",
      kind: "low_season",
      tier: ACTION_RISK_TIER.OWNER_VISIBLE,
      title: "Lead flow is slowing",
      reason: `You have ${baseline_count} earlier leads and ${recent_count} recent leads. Review sources and follow-ups before the pipeline cools.`,
      suggestedAction: "Open the Source Breakdown and Recent Activity to find which channels stalled.",
      href: "/leads",
    });
  }

  return items;
};
