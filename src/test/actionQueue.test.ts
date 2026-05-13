import { describe, expect, it } from "vitest";
import { ACTION_RISK_TIER } from "@/lib/actionTiers";
import { buildActionQueueItems } from "@/lib/actionQueue";
import { buildLeadStats, type LeadStatsLead } from "@/lib/leadStats";

const now = new Date("2026-04-30T12:00:00.000Z");

const makeLead = (overrides: Partial<LeadStatsLead>): LeadStatsLead => {
  const id = overrides.id || crypto.randomUUID();
  return {
    id,
    full_name: overrides.full_name || "Lead",
    status: overrides.status || "new",
    source: overrides.source ?? "manual",
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

describe("action queue aggregation", () => {
  it("returns an empty queue when there is no deterministic owner action", () => {
    const stats = buildLeadStats([makeLead({ id: "1", status: "new" })], now);

    expect(buildActionQueueItems(stats)).toEqual([]);
  });

  it("surfaces due follow-ups as Tier 1 owner-visible items", () => {
    const stats = buildLeadStats([
      makeLead({ id: "due", full_name: "Maya Chen", reminder_at: "2026-04-30T11:00:00.000Z" }),
    ], now);
    const items = buildActionQueueItems(stats);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      kind: "follow_up_due",
      tier: ACTION_RISK_TIER.OWNER_VISIBLE,
      title: "Follow up with Maya Chen",
      href: "/leads/due",
    });
  });

  it("surfaces needs-review leads without creating a fake AI action", () => {
    const stats = buildLeadStats([
      makeLead({ id: "review-1", status: "needs_review" }),
      makeLead({ id: "review-2", status: "needs_review" }),
    ], now);
    const items = buildActionQueueItems(stats);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      kind: "needs_review",
      tier: ACTION_RISK_TIER.OWNER_VISIBLE,
      title: "2 leads waiting for qualification",
      href: "/leads?signal=needs_review",
    });
  });

  it("surfaces missing information, duplicates, imports, and no-follow-up risks as Tier 1", () => {
    const stats = buildLeadStats([
      makeLead({
        id: "stale-new",
        full_name: "No Touch",
        created_at: "2026-04-20T10:00:00.000Z",
      }),
      makeLead({
        id: "missing",
        full_name: "Missing Lead",
        email: "unknown+abc@manual.avitus",
        budget_range: null,
      }),
      makeLead({ id: "dupe-1", full_name: "Maya", email: "maya@example.com" }),
      makeLead({ id: "dupe-2", full_name: "Maya Duplicate", email: "maya@example.com" }),
      makeLead({ id: "import", source: "imported", status: "new" }),
    ], now);
    const kinds = buildActionQueueItems(stats).map((item) => item.kind);

    expect(kinds).toEqual(expect.arrayContaining([
      "status_health",
      "missing_info",
      "possible_duplicate",
      "import_review",
    ]));
    expect(buildActionQueueItems(stats).every((item) => item.tier === ACTION_RISK_TIER.OWNER_VISIBLE)).toBe(true);
  });

  it("surfaces deterministic low-season signals", () => {
    const stats = buildLeadStats([
      ...makeLeadsForDate("2026-04-02", 4),
      ...makeLeadsForDate("2026-04-09", 4),
      ...makeLeadsForDate("2026-04-16", 4),
    ], now, "30D");
    const items = buildActionQueueItems(stats);

    expect(stats.seasonality.status).toBe("low_season");
    expect(items.some((item) => item.kind === "low_season")).toBe(true);
    expect(items.find((item) => item.kind === "low_season")?.tier).toBe(ACTION_RISK_TIER.OWNER_VISIBLE);
  });
});
