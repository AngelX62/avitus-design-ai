import { describe, expect, it } from "vitest";
import { LEAD_STATUSES } from "@/lib/leadTypes";
import { buildLeadStats, type LeadStatsLead } from "@/lib/leadStats";

const makeLead = (overrides: Partial<LeadStatsLead>): LeadStatsLead => {
  const id = overrides.id || crypto.randomUUID();
  return {
    id,
    full_name: overrides.full_name || "Lead",
    status: overrides.status || "new",
    source: Object.prototype.hasOwnProperty.call(overrides, "source") ? overrides.source! : "manual",
    classification: overrides.classification ?? null,
    fit_score: overrides.fit_score ?? null,
    ai_next_action: overrides.ai_next_action ?? null,
    email: overrides.email ?? `${id}@example.com`,
    phone: overrides.phone ?? null,
    project_type: overrides.project_type ?? "Full home",
    property_type: overrides.property_type ?? null,
    location: overrides.location ?? "Jakarta",
    budget_range: overrides.budget_range ?? "$100k",
    timeline: overrides.timeline ?? "This quarter",
    raw_inquiry: overrides.raw_inquiry ?? null,
    brief: overrides.brief ?? null,
    ai_analysis_status: overrides.ai_analysis_status ?? "not_configured",
    created_at: overrides.created_at || "2026-04-30T10:00:00.000Z",
    reminder_at: overrides.reminder_at ?? null,
    last_contacted_at: overrides.last_contacted_at ?? null,
  };
};

const makeLeadsForDate = (date: string, count: number): LeadStatsLead[] =>
  Array.from({ length: count }, (_, index) =>
    makeLead({
      id: `${date}-${index}`,
      created_at: `${date}T10:00:00.000Z`,
    }),
  );

describe("lead stats aggregation", () => {
  const now = new Date("2026-04-30T12:00:00.000Z");

  it("counts total, new, won, lost, and follow-ups due", () => {
    const stats = buildLeadStats([
      makeLead({ id: "1", status: "new" }),
      makeLead({ id: "2", status: "won", reminder_at: "2026-04-29T12:00:00.000Z" }),
      makeLead({ id: "3", status: "lost", reminder_at: "2026-05-01T12:00:00.000Z" }),
      makeLead({ id: "4", status: "contacted" }),
    ], now);

    expect(stats.summary.totalLeads).toBe(4);
    expect(stats.summary.newLeads).toBe(1);
    expect(stats.summary.wonLeads).toBe(1);
    expect(stats.summary.lostLeads).toBe(1);
    expect(stats.summary.followUpsDue).toBe(1);
  });

  it("calculates conversion rate from won over closed leads", () => {
    const stats = buildLeadStats([
      makeLead({ id: "1", status: "won" }),
      makeLead({ id: "2", status: "won" }),
      makeLead({ id: "3", status: "lost" }),
      makeLead({ id: "4", status: "new" }),
    ], now);

    expect(stats.summary.closedLeads).toBe(3);
    expect(stats.summary.conversionRate).toBe(67);
    expect(stats.summary.conversionRateLabel).toBe("67%");
    expect(stats.summary.hasClosedLeads).toBe(true);
  });

  it("returns zero conversion rate when there are no closed leads", () => {
    const stats = buildLeadStats([
      makeLead({ id: "1", status: "new" }),
      makeLead({ id: "2", status: "contacted" }),
    ], now);

    expect(stats.summary.closedLeads).toBe(0);
    expect(stats.summary.conversionRate).toBe(0);
    expect(stats.summary.conversionRateLabel).toBe("0%");
    expect(stats.summary.hasClosedLeads).toBe(false);
  });

  it("keeps the V1 status funnel order", () => {
    const stats = buildLeadStats([
      makeLead({ id: "1", status: "won" }),
      makeLead({ id: "2", status: "needs_review" }),
    ], now);

    expect(stats.statusRows.map((row) => row.key)).toEqual([...LEAD_STATUSES]);
    expect(stats.statusRows.find((row) => row.key === "needs_review")?.count).toBe(1);
    expect(stats.statusRows.find((row) => row.key === "won")?.count).toBe(1);
  });

  it("builds a zero-filled last-30-days timeline and counts created leads by day", () => {
    const stats = buildLeadStats([
      makeLead({ id: "1", created_at: "2026-04-30T02:00:00.000Z" }),
      makeLead({ id: "2", created_at: "2026-04-30T18:00:00.000Z" }),
      makeLead({ id: "3", created_at: "2026-04-01T09:00:00.000Z" }),
      makeLead({ id: "4", created_at: "2026-03-31T23:59:59.000Z" }),
    ], now);

    expect(stats.timelineRows).toHaveLength(30);
    expect(stats.timelineRows[0].date).toBe("2026-04-01");
    expect(stats.timelineRows[29].date).toBe("2026-04-30");
    expect(stats.timelineRows.find((row) => row.date === "2026-04-01")?.count).toBe(1);
    expect(stats.timelineRows.find((row) => row.date === "2026-04-30")?.count).toBe(2);
  });

  it("builds zero-filled daily timelines for 7-day and 90-day ranges", () => {
    const sevenDayStats = buildLeadStats([
      makeLead({ id: "1", created_at: "2026-04-24T00:00:00.000Z" }),
      makeLead({ id: "2", created_at: "2026-04-30T23:59:59.000Z" }),
      makeLead({ id: "3", created_at: "2026-04-23T23:59:59.000Z" }),
    ], now, "7D");
    const ninetyDayStats = buildLeadStats([], now, "90D");

    expect(sevenDayStats.timelineRows).toHaveLength(7);
    expect(sevenDayStats.timelineRows[0].date).toBe("2026-04-24");
    expect(sevenDayStats.timelineRows[6].date).toBe("2026-04-30");
    expect(sevenDayStats.timelineRows.find((row) => row.date === "2026-04-24")?.count).toBe(1);
    expect(sevenDayStats.timelineRows.find((row) => row.date === "2026-04-30")?.count).toBe(1);
    expect(ninetyDayStats.timelineRows).toHaveLength(90);
  });

  it("builds a zero-filled last-12-months timeline and counts created leads by month", () => {
    const stats = buildLeadStats([
      makeLead({ id: "1", created_at: "2025-05-01T00:00:00.000Z" }),
      makeLead({ id: "2", created_at: "2026-04-30T23:59:59.000Z" }),
      makeLead({ id: "3", created_at: "2025-04-30T23:59:59.000Z" }),
    ], now, "12M");

    expect(stats.timelineRows).toHaveLength(12);
    expect(stats.timelineRows[0].date).toBe("2025-05");
    expect(stats.timelineRows[11].date).toBe("2026-04");
    expect(stats.timelineRows.find((row) => row.date === "2025-05")?.count).toBe(1);
    expect(stats.timelineRows.find((row) => row.date === "2026-04")?.count).toBe(1);
  });

  it("keeps KPI totals all-time when the timeline range excludes older leads", () => {
    const stats = buildLeadStats([
      makeLead({ id: "1", status: "won", created_at: "2026-01-01T12:00:00.000Z" }),
      makeLead({ id: "2", status: "lost", created_at: "2026-04-30T12:00:00.000Z" }),
    ], now, "7D");

    expect(stats.summary.totalLeads).toBe(2);
    expect(stats.summary.closedLeads).toBe(2);
    expect(stats.summary.conversionRate).toBe(50);
    expect(stats.timelineRows.reduce((total, row) => total + row.count, 0)).toBe(1);
  });

  it("flags low season when recent lead volume drops against the range baseline", () => {
    const stats = buildLeadStats([
      ...makeLeadsForDate("2026-04-02", 4),
      ...makeLeadsForDate("2026-04-09", 4),
      ...makeLeadsForDate("2026-04-16", 4),
    ], now, "30D");

    expect(stats.seasonality.status).toBe("low_season");
    expect(stats.seasonality.baseline_count).toBe(12);
    expect(stats.seasonality.recent_count).toBe(0);
    expect(stats.seasonality.message).toContain("quieter");
  });

  it("decorates only recent low-season buckets as quiet", () => {
    const stats = buildLeadStats([
      ...makeLeadsForDate("2026-04-02", 4),
      ...makeLeadsForDate("2026-04-09", 4),
      ...makeLeadsForDate("2026-04-16", 4),
    ], now, "30D");
    const baselineRows = stats.timelineRows.slice(0, -7);
    const recentRows = stats.timelineRows.slice(-7);

    expect(stats.seasonality.status).toBe("low_season");
    expect(recentRows.every((row) => row.is_recent)).toBe(true);
    expect(recentRows.every((row) => row.is_quiet)).toBe(true);
    expect(recentRows.every((row) => row.baseline === stats.seasonality.baseline_average)).toBe(true);
    expect(baselineRows.some((row) => row.is_quiet)).toBe(false);
  });

  it("flags building when recent lead volume rises against the range baseline", () => {
    const stats = buildLeadStats([
      ...makeLeadsForDate("2026-04-03", 4),
      ...makeLeadsForDate("2026-04-26", 2),
      ...makeLeadsForDate("2026-04-27", 2),
      ...makeLeadsForDate("2026-04-28", 2),
      ...makeLeadsForDate("2026-04-29", 2),
    ], now, "30D");

    expect(stats.seasonality.status).toBe("building");
    expect(stats.seasonality.recent_count).toBe(8);
    expect(stats.seasonality.message).toContain("building");
    expect(stats.timelineRows.slice(-7).every((row) => row.is_recent)).toBe(true);
    expect(stats.timelineRows.some((row) => row.is_quiet)).toBe(false);
  });

  it("flags steady when recent and baseline lead volume are similar", () => {
    const baselineLeads = Array.from({ length: 23 }, (_, index) =>
      makeLead({
        id: `baseline-${index}`,
        created_at: `2026-04-${String(index + 1).padStart(2, "0")}T10:00:00.000Z`,
      }),
    );
    const recentLeads = Array.from({ length: 7 }, (_, index) =>
      makeLead({
        id: `recent-${index}`,
        created_at: `2026-04-${String(index + 24).padStart(2, "0")}T10:00:00.000Z`,
      }),
    );

    const stats = buildLeadStats([...baselineLeads, ...recentLeads], now, "30D");

    expect(stats.seasonality.status).toBe("steady");
    expect(stats.seasonality.baseline_average).toBe(1);
    expect(stats.seasonality.recent_average).toBe(1);
  });

  it("does not call a seasonal pattern when data is too sparse", () => {
    const stats = buildLeadStats([
      makeLead({ id: "1", created_at: "2026-04-15T10:00:00.000Z" }),
    ], now, "30D");

    expect(stats.seasonality.status).toBe("not_enough_data");
    expect(stats.seasonality.message).toContain("Not enough");
    expect(stats.timelineRows.every((row) => row.baseline === null)).toBe(true);
    expect(stats.timelineRows.some((row) => row.is_quiet)).toBe(false);
  });

  it("updates seasonality with the selected timeline range without changing KPI totals", () => {
    const leads = [
      ...makeLeadsForDate("2026-04-02", 8),
      ...makeLeadsForDate("2026-04-27", 4),
      makeLead({ id: "won", status: "won", created_at: "2026-04-27T12:00:00.000Z" }),
      makeLead({ id: "lost", status: "lost", created_at: "2026-04-02T12:00:00.000Z" }),
    ];
    const thirtyDayStats = buildLeadStats(leads, now, "30D");
    const sevenDayStats = buildLeadStats(leads, now, "7D");

    expect(thirtyDayStats.summary.totalLeads).toBe(sevenDayStats.summary.totalLeads);
    expect(thirtyDayStats.summary.closedLeads).toBe(sevenDayStats.summary.closedLeads);
    expect(thirtyDayStats.timelineRows).toHaveLength(30);
    expect(sevenDayStats.timelineRows).toHaveLength(7);
    expect(thirtyDayStats.seasonality.status).not.toBe(sevenDayStats.seasonality.status);
  });

  it("maps known sources and groups unknown or missing sources as Other", () => {
    const stats = buildLeadStats([
      makeLead({ id: "1", source: "intake_form" }),
      makeLead({ id: "2", source: "pasted" }),
      makeLead({ id: "3", source: "imported" }),
      makeLead({ id: "4", source: "manual" }),
      makeLead({ id: "5", source: "legacy_sheet" }),
      makeLead({ id: "6", source: null }),
    ], now);

    expect(stats.sourceRows.find((row) => row.key === "intake_form")?.count).toBe(1);
    expect(stats.sourceRows.find((row) => row.key === "pasted")?.label).toBe("Paste Message");
    expect(stats.sourceRows.find((row) => row.key === "imported")?.label).toBe("Import Sheet");
    expect(stats.sourceRows.find((row) => row.key === "manual")?.count).toBe(1);
    expect(stats.sourceRows.find((row) => row.key === "other")?.count).toBe(2);
  });

  it("only marks reminder dates at or before now as follow-ups due", () => {
    const stats = buildLeadStats([
      makeLead({ id: "1", reminder_at: "2026-04-30T11:59:00.000Z" }),
      makeLead({ id: "2", reminder_at: "2026-04-30T12:00:00.000Z" }),
      makeLead({ id: "3", reminder_at: "2026-04-30T12:01:00.000Z" }),
      makeLead({ id: "4", reminder_at: null }),
    ], now);

    expect(stats.dueFollowups.map((lead) => lead.id)).toEqual(["1", "2"]);
  });

  it("counts Foundation missing info, duplicate groups, import review, and no-first-follow-up risks", () => {
    const stats = buildLeadStats([
      makeLead({
        id: "missing",
        email: "unknown+1@intake.avitus",
        budget_range: null,
        timeline: null,
        project_type: null,
        location: null,
      }),
      makeLead({ id: "dupe-1", email: "same@example.com" }),
      makeLead({ id: "dupe-2", email: "same@example.com" }),
      makeLead({ id: "import", source: "imported", status: "new" }),
      makeLead({ id: "untouched", created_at: "2026-04-20T10:00:00.000Z" }),
    ], now);

    expect(stats.summary.missingInfoCount).toBe(1);
    expect(stats.summary.possibleDuplicateGroups).toBe(1);
    expect(stats.duplicateGroups[0]).toMatchObject({ count: 2, label: "Same email" });
    expect(stats.summary.importRowsNeedingReview).toBe(1);
    expect(stats.summary.noFollowUpRiskCount).toBe(1);
  });
});
