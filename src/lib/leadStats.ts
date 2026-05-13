import { LEAD_SOURCES, LEAD_STATUSES, SOURCE_LABELS, STATUS_LABELS, type LeadStatus } from "@/lib/leadTypes";
import {
  duplicateKeyForLead,
  getMissingFoundationFields,
  hasNoFirstFollowUpRisk,
  type LeadShape,
} from "@/lib/leadSignals";

export type LeadStatsLead = LeadShape & {
  id: string;
  full_name: string;
  status: string;
  source: string | null;
  classification: string | null;
  fit_score: number | null;
  ai_next_action: string | null;
  email?: string | null;
  phone?: string | null;
  project_type: string | null;
  property_type?: string | null;
  location?: string | null;
  budget_range: string | null;
  timeline: string | null;
  raw_inquiry?: string | null;
  brief?: string | null;
  ai_analysis_status?: string | null;
  created_at: string;
  reminder_at: string | null;
  last_contacted_at: string | null;
};

export type LeadDuplicateGroup = {
  key: string;
  label: string;
  lead_ids: string[];
  names: string[];
  count: number;
};

export type LeadStatsSummary = {
  totalLeads: number;
  newLeads: number;
  wonLeads: number;
  lostLeads: number;
  closedLeads: number;
  conversionRate: number;
  conversionRateLabel: string;
  hasClosedLeads: boolean;
  followUpsDue: number;
  needsReviewCount: number;
  goingColdCount: number;
  noFollowUpRiskCount: number;
  missingInfoCount: number;
  importRowsNeedingReview: number;
  possibleDuplicateGroups: number;
};

const GOING_COLD_THRESHOLD_MS = 14 * 86_400_000;
const isOpenStatus = (status: string) => status !== "won" && status !== "lost";

export type LeadStatusDatum = {
  key: LeadStatus;
  label: string;
  count: number;
};

export type LeadTimelineDatum = {
  date: string;
  label: string;
  count: number;
  baseline?: number | null;
  is_recent?: boolean;
  is_quiet?: boolean;
};

export type LeadSeasonalityStatus = "low_season" | "steady" | "building" | "not_enough_data";

export type LeadSeasonalityInsight = {
  status: LeadSeasonalityStatus;
  recent_count: number;
  baseline_count: number;
  recent_average: number;
  baseline_average: number;
  message: string;
};

export const LEAD_TIMELINE_RANGES = ["7D", "30D", "90D", "12M"] as const;

export type LeadTimelineRange = (typeof LEAD_TIMELINE_RANGES)[number];

export const LEAD_TIMELINE_RANGE_OPTIONS: Array<{
  key: LeadTimelineRange;
  label: string;
  title: string;
  description: string;
}> = [
  { key: "7D", label: "7D", title: "Last 7 days.", description: "Created leads by day." },
  { key: "30D", label: "30D", title: "Last 30 days.", description: "Created leads by day." },
  { key: "90D", label: "90D", title: "Last 90 days.", description: "Created leads by day." },
  { key: "12M", label: "12M", title: "Last 12 months.", description: "Created leads by month." },
];

export type LeadSourceDatum = {
  key: string;
  label: string;
  count: number;
};

export type LeadStatsActivity = {
  id: string;
  name: string;
  source: string | null;
  at: string;
};

export type LeadStats = {
  summary: LeadStatsSummary;
  statusRows: LeadStatusDatum[];
  timelineRows: LeadTimelineDatum[];
  seasonality: LeadSeasonalityInsight;
  sourceRows: LeadSourceDatum[];
  dueFollowups: LeadStatsLead[];
  duplicateGroups: LeadDuplicateGroup[];
  recentEvents: LeadStatsActivity[];
  isEmpty: boolean;
};

const MS_PER_DAY = 86_400_000;
const SOURCE_ORDER = [...LEAD_SOURCES, "other"] as const;
const TIMELINE_DAY_COUNTS: Record<Exclude<LeadTimelineRange, "12M">, number> = {
  "7D": 7,
  "30D": 30,
  "90D": 90,
};
const MIN_BASELINE_COUNT_FOR_SEASONALITY = 3;

const sourceLabels: Record<string, string> = {
  intake_form: SOURCE_LABELS.intake_form,
  pasted: "Paste Message",
  imported: "Import Sheet",
  manual: SOURCE_LABELS.manual,
  other: "Other",
};

const startOfUtcDay = (date: Date) =>
  Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

const startOfUtcMonth = (date: Date) =>
  Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);

const addUtcMonths = (monthStartMs: number, offset: number) => {
  const date = new Date(monthStartMs);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offset, 1);
};

const dayKeyFromMs = (ms: number) => new Date(ms).toISOString().slice(0, 10);

const monthKeyFromMs = (ms: number) => new Date(ms).toISOString().slice(0, 7);

const formatDayLabel = (dateKey: string) =>
  new Date(`${dateKey}T00:00:00.000Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

const formatMonthLabel = (monthKey: string) =>
  new Date(`${monthKey}-01T00:00:00.000Z`).toLocaleDateString(undefined, {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });

const isKnownSource = (source: string | null): source is (typeof LEAD_SOURCES)[number] =>
  Boolean(source && (LEAD_SOURCES as readonly string[]).includes(source));

const labelForDuplicateKey = (key: string) => {
  if (key.startsWith("email:")) return "Same email";
  if (key.startsWith("phone:")) return "Same phone";
  return "Similar name and location";
};

export const buildDuplicateGroups = (leads: LeadStatsLead[]): LeadDuplicateGroup[] => {
  const groups = new Map<string, LeadStatsLead[]>();

  for (const lead of leads) {
    const key = duplicateKeyForLead(lead);
    if (!key) continue;
    const group = groups.get(key) ?? [];
    group.push(lead);
    groups.set(key, group);
  }

  return Array.from(groups.entries())
    .filter(([, group]) => group.length > 1)
    .map(([key, group]) => ({
      key,
      label: labelForDuplicateKey(key),
      lead_ids: group.map((lead) => lead.id),
      names: group.map((lead) => lead.full_name),
      count: group.length,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
};

const buildDailyTimeline = (leads: LeadStatsLead[], now: Date, days: number): LeadTimelineDatum[] => {
  const todayStart = startOfUtcDay(now);
  const timelineStart = todayStart - (days - 1) * MS_PER_DAY;
  const timelineEnd = todayStart + MS_PER_DAY;
  const timelineCounts = new Map<string, number>();

  for (let offset = 0; offset < days; offset += 1) {
    const date = dayKeyFromMs(timelineStart + offset * MS_PER_DAY);
    timelineCounts.set(date, 0);
  }

  for (const lead of leads) {
    const createdTime = new Date(lead.created_at).getTime();
    if (Number.isFinite(createdTime) && createdTime >= timelineStart && createdTime < timelineEnd) {
      const date = dayKeyFromMs(startOfUtcDay(new Date(createdTime)));
      timelineCounts.set(date, (timelineCounts.get(date) || 0) + 1);
    }
  }

  return Array.from(timelineCounts.entries()).map(([date, count]) => ({
    date,
    label: formatDayLabel(date),
    count,
  }));
};

const buildMonthlyTimeline = (leads: LeadStatsLead[], now: Date, months: number): LeadTimelineDatum[] => {
  const currentMonthStart = startOfUtcMonth(now);
  const timelineStart = addUtcMonths(currentMonthStart, -(months - 1));
  const timelineEnd = addUtcMonths(currentMonthStart, 1);
  const timelineCounts = new Map<string, number>();

  for (let offset = 0; offset < months; offset += 1) {
    const date = monthKeyFromMs(addUtcMonths(timelineStart, offset));
    timelineCounts.set(date, 0);
  }

  for (const lead of leads) {
    const createdTime = new Date(lead.created_at).getTime();
    if (Number.isFinite(createdTime) && createdTime >= timelineStart && createdTime < timelineEnd) {
      const date = monthKeyFromMs(startOfUtcMonth(new Date(createdTime)));
      timelineCounts.set(date, (timelineCounts.get(date) || 0) + 1);
    }
  }

  return Array.from(timelineCounts.entries()).map(([date, count]) => ({
    date,
    label: formatMonthLabel(date),
    count,
  }));
};

const buildTimelineRows = (leads: LeadStatsLead[], now: Date, range: LeadTimelineRange) => {
  if (range === "12M") return buildMonthlyTimeline(leads, now, 12);
  return buildDailyTimeline(leads, now, TIMELINE_DAY_COUNTS[range]);
};

const sumTimelineCounts = (rows: LeadTimelineDatum[]) =>
  rows.reduce((total, row) => total + row.count, 0);

const roundAverage = (value: number) => Math.round(value * 10) / 10;

const recentWindowSizeForRange = (range: LeadTimelineRange) =>
  range === "12M" ? 3 : range === "7D" ? 3 : 7;

const buildSeasonalityInsight = (
  rows: LeadTimelineDatum[],
  range: LeadTimelineRange,
): LeadSeasonalityInsight => {
  const recentWindow = recentWindowSizeForRange(range);
  const recentRows = rows.slice(-recentWindow);
  const baselineRows = rows.slice(0, Math.max(0, rows.length - recentWindow));
  const recentCount = sumTimelineCounts(recentRows);
  const baselineCount = sumTimelineCounts(baselineRows);
  const recentAverage = recentRows.length ? recentCount / recentRows.length : 0;
  const baselineAverage = baselineRows.length ? baselineCount / baselineRows.length : 0;
  const base = {
    recent_count: recentCount,
    baseline_count: baselineCount,
    recent_average: roundAverage(recentAverage),
    baseline_average: roundAverage(baselineAverage),
  };

  if (!recentRows.length || !baselineRows.length || baselineCount < MIN_BASELINE_COUNT_FOR_SEASONALITY) {
    return {
      ...base,
      status: "not_enough_data",
      message: "Not enough lead volume yet to call a seasonal pattern.",
    };
  }

  if (recentAverage <= baselineAverage * 0.6) {
    return {
      ...base,
      status: "low_season",
      message: "Lead volume is quieter than the earlier part of this range.",
    };
  }

  if (recentAverage >= baselineAverage * 1.25) {
    return {
      ...base,
      status: "building",
      message: "Lead volume is building compared with the earlier part of this range.",
    };
  }

  return {
    ...base,
    status: "steady",
    message: "Lead volume is steady against the earlier part of this range.",
  };
};

const decorateTimelineRows = (
  rows: LeadTimelineDatum[],
  range: LeadTimelineRange,
  seasonality: LeadSeasonalityInsight,
): LeadTimelineDatum[] => {
  const recentWindow = recentWindowSizeForRange(range);
  const recentStartIndex = Math.max(0, rows.length - recentWindow);
  const hasBaseline = seasonality.status !== "not_enough_data" && seasonality.baseline_average > 0;

  return rows.map((row, index) => {
    const isRecent = index >= recentStartIndex;
    const isQuiet =
      seasonality.status === "low_season" &&
      hasBaseline &&
      isRecent &&
      row.count < seasonality.baseline_average;

    return {
      ...row,
      baseline: hasBaseline ? seasonality.baseline_average : null,
      is_recent: isRecent,
      is_quiet: isQuiet,
    };
  });
};

export const buildLeadStats = (
  leads: LeadStatsLead[],
  now = new Date(),
  timelineRange: LeadTimelineRange = "30D",
): LeadStats => {
  const statusCounts: Record<string, number> = {};
  const sourceCounts: Record<string, number> = {};
  const nowTime = now.getTime();

  for (const lead of leads) {
    statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;

    const sourceKey = isKnownSource(lead.source) ? lead.source : "other";
    sourceCounts[sourceKey] = (sourceCounts[sourceKey] || 0) + 1;
  }

  const wonLeads = statusCounts.won || 0;
  const lostLeads = statusCounts.lost || 0;
  const closedLeads = wonLeads + lostLeads;
  const conversionRate = closedLeads > 0 ? Math.round((wonLeads / closedLeads) * 100) : 0;
  const rawTimelineRows = buildTimelineRows(leads, now, timelineRange);
  const seasonality = buildSeasonalityInsight(rawTimelineRows, timelineRange);
  const timelineRows = decorateTimelineRows(rawTimelineRows, timelineRange, seasonality);
  const dueFollowups = leads
    .filter((lead) => {
      if (!lead.reminder_at) return false;
      const reminderTime = new Date(lead.reminder_at).getTime();
      return Number.isFinite(reminderTime) && reminderTime <= nowTime;
    })
    .sort((a, b) => new Date(a.reminder_at || 0).getTime() - new Date(b.reminder_at || 0).getTime());

  const duplicateGroups = buildDuplicateGroups(leads);
  let goingColdCount = 0;
  let noFollowUpRiskCount = 0;
  let missingInfoCount = 0;
  let importRowsNeedingReview = 0;
  for (const lead of leads) {
    const open = isOpenStatus(lead.status);
    if (open && lead.last_contacted_at) {
      const last = new Date(lead.last_contacted_at).getTime();
      if (Number.isFinite(last) && nowTime - last > GOING_COLD_THRESHOLD_MS) {
        goingColdCount += 1;
      }
    }
    if (open && hasNoFirstFollowUpRisk(lead, now)) {
      noFollowUpRiskCount += 1;
    }
    if (open && getMissingFoundationFields(lead).length > 0) {
      missingInfoCount += 1;
    }
    if (lead.source === "imported" && lead.status === "new") {
      importRowsNeedingReview += 1;
    }
  }

  return {
    summary: {
      totalLeads: leads.length,
      newLeads: statusCounts.new || 0,
      wonLeads,
      lostLeads,
      closedLeads,
      conversionRate,
      conversionRateLabel: `${conversionRate}%`,
      hasClosedLeads: closedLeads > 0,
      followUpsDue: dueFollowups.length,
      needsReviewCount: statusCounts.needs_review || 0,
      goingColdCount,
      noFollowUpRiskCount,
      missingInfoCount,
      importRowsNeedingReview,
      possibleDuplicateGroups: duplicateGroups.length,
    },
    statusRows: LEAD_STATUSES.map((status) => ({
      key: status,
      label: STATUS_LABELS[status] || status,
      count: statusCounts[status] || 0,
    })),
    timelineRows,
    seasonality,
    sourceRows: SOURCE_ORDER.map((source) => ({
      key: source,
      label: sourceLabels[source] || source,
      count: sourceCounts[source] || 0,
    })),
    dueFollowups,
    duplicateGroups,
    recentEvents: [...leads]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 15)
      .map((lead) => ({
        id: lead.id,
        name: lead.full_name,
        source: lead.source,
        at: lead.created_at,
      })),
    isEmpty: leads.length === 0,
  };
};
