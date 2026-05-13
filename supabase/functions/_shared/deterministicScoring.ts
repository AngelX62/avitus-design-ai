export const SCORE_RUBRIC_VERSION = "v1_weighted_interiors";

export const SIGNAL_MULTIPLIERS = {
  strong: 1,
  partial: 0.6,
  weak: 0.2,
  unknown: 0,
} as const;

export type ScoringSignal = keyof typeof SIGNAL_MULTIPLIERS;
export type LeadClassification = "hot" | "warm" | "cold" | "not_fit" | "needs_review";

export type ScoringCriterionKey =
  | "budget_fit"
  | "timeline_fit"
  | "location_fit"
  | "project_type_fit"
  | "decision_maker"
  | "clarity";

export type CriterionSignal = {
  signal: ScoringSignal;
  reason?: string | null;
  evidence?: string | null;
};

export type LeadScoringSignals = Record<ScoringCriterionKey, CriterionSignal>;

export type LeadContactContext = {
  email?: string | null;
  phone?: string | null;
};

export type WeightedCriterion = {
  key: ScoringCriterionKey;
  label: string;
  max_points: number;
  awarded_points: number;
  signal: ScoringSignal;
  reason: string;
  evidence: string | null;
  source_field: string;
};

export type WeightedScoreRubric = {
  version: typeof SCORE_RUBRIC_VERSION;
  total_score: number;
  classification: LeadClassification;
  criteria: WeightedCriterion[];
  review_reasons: string[];
};

export const SCORE_CRITERIA: Array<{
  key: ScoringCriterionKey;
  label: string;
  max_points: number;
  source_field: string;
}> = [
  { key: "budget_fit", label: "Budget fit", max_points: 30, source_field: "budget_range" },
  { key: "timeline_fit", label: "Timeline fit", max_points: 20, source_field: "timeline" },
  { key: "location_fit", label: "Location fit", max_points: 15, source_field: "location" },
  { key: "project_type_fit", label: "Project type fit", max_points: 15, source_field: "project_type" },
  { key: "decision_maker", label: "Decision-maker readiness", max_points: 10, source_field: "raw_inquiry" },
  { key: "clarity", label: "Clarity / completeness", max_points: 10, source_field: "raw_inquiry" },
];

const PLACEHOLDER_EMAIL_DOMAINS = ["intake.avitus", "import.avitus", "manual.avitus"];

const isPlaceholderEmail = (email: string) => {
  const lower = email.toLowerCase();
  return lower.startsWith("unknown+") || PLACEHOLDER_EMAIL_DOMAINS.some((domain) => lower.endsWith(`@${domain}`));
};

export const hasUsableContact = (contact: LeadContactContext) => {
  const email = contact.email?.trim();
  const phone = contact.phone?.trim();
  return Boolean(phone || (email && !isPlaceholderEmail(email)));
};

export const classifyScore = (score: number): Exclude<LeadClassification, "needs_review"> => {
  if (score >= 80) return "hot";
  if (score >= 55) return "warm";
  if (score >= 30) return "cold";
  return "not_fit";
};

const normalizeSignal = (signal?: string | null): ScoringSignal => {
  if (signal === "strong" || signal === "partial" || signal === "weak" || signal === "unknown") return signal;
  return "unknown";
};

export const computeWeightedLeadScore = (
  signals: Partial<Record<ScoringCriterionKey, Partial<CriterionSignal> | null | undefined>>,
  contact: LeadContactContext,
): WeightedScoreRubric => {
  const criteria = SCORE_CRITERIA.map((criterion) => {
    const input = signals[criterion.key];
    const signal = normalizeSignal(input?.signal);
    const awarded_points = Math.round(criterion.max_points * SIGNAL_MULTIPLIERS[signal]);
    return {
      key: criterion.key,
      label: criterion.label,
      max_points: criterion.max_points,
      awarded_points,
      signal,
      reason: input?.reason?.trim() || "No clear evidence was available.",
      evidence: input?.evidence?.trim() || null,
      source_field: criterion.source_field,
    };
  });

  const total_score = criteria.reduce((sum, criterion) => sum + criterion.awarded_points, 0);
  const unknownCount = criteria.filter((criterion) => criterion.signal === "unknown").length;
  const review_reasons: string[] = [];

  if (!hasUsableContact(contact)) review_reasons.push("Missing usable contact information.");
  if (unknownCount >= 3) review_reasons.push("Three or more scoring criteria are unknown.");

  return {
    version: SCORE_RUBRIC_VERSION,
    total_score,
    classification: review_reasons.length > 0 ? "needs_review" : classifyScore(total_score),
    criteria,
    review_reasons,
  };
};

export const temperatureFromClassification = (classification: LeadClassification) =>
  classification === "hot" || classification === "warm" || classification === "cold" ? classification : null;
