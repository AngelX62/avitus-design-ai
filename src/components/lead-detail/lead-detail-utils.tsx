import { motion, useReducedMotion } from "motion/react";

export const REVEAL_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const REVEAL_DURATION = 0.48;

const RUBRIC_SEGMENTS = 12;

export const ScoreRubric = ({ awarded, max }: { awarded: number | null; max: number }) => {
  const reduced = useReducedMotion();
  const filled = awarded == null ? 0 : Math.round((Math.max(0, Math.min(awarded, max)) / max) * RUBRIC_SEGMENTS);
  return (
    <div className="flex items-center gap-1.5" role="meter" aria-valuemin={0} aria-valuemax={max} aria-valuenow={awarded ?? 0}>
      {Array.from({ length: RUBRIC_SEGMENTS }).map((_, i) => {
        const isOn = i < filled;
        return (
          <motion.span
            key={i}
            aria-hidden
            initial={reduced ? false : { opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.32, delay: reduced ? 0 : i * 0.045, ease: REVEAL_EASE }}
            className={`h-1.5 w-1.5 rounded-full ${isOn ? "bg-pine" : "bg-stone/15"}`}
          />
        );
      })}
    </div>
  );
};

export const SCORE_ROWS = [
  { key: "budget_fit", label: "Budget fit", max_points: 30 },
  { key: "timeline_fit", label: "Timeline fit", max_points: 20 },
  { key: "location_fit", label: "Location fit", max_points: 15 },
  { key: "project_type_fit", label: "Project type fit", max_points: 15 },
  { key: "decision_maker", label: "Decision-maker readiness", max_points: 10 },
  { key: "clarity", label: "Clarity / completeness", max_points: 10 },
];

export type DisplayCriterion = {
  key: string;
  label: string;
  max_points: number;
  awarded_points: number | null;
  reason: string | null;
  evidence: string | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toScoreNumber = (value: unknown) => {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

export const normalizeScoreCriteria = (scoreBreakdown: unknown): DisplayCriterion[] => {
  if (!isRecord(scoreBreakdown)) return [];

  if (Array.isArray(scoreBreakdown.criteria)) {
    return scoreBreakdown.criteria
      .map((criterion, index) => {
        if (!isRecord(criterion)) return null;
        const max_points = toScoreNumber(criterion.max_points) ?? 0;
        if (max_points <= 0) return null;
        const key = String(criterion.key || `criterion_${index}`);
        const fallbackLabel = SCORE_ROWS.find((row) => row.key === key)?.label || key.replace(/_/g, " ");
        return {
          key,
          label: String(criterion.label || fallbackLabel),
          max_points,
          awarded_points: toScoreNumber(criterion.awarded_points) ?? 0,
          reason: typeof criterion.reason === "string" ? criterion.reason : null,
          evidence: typeof criterion.evidence === "string" ? criterion.evidence : null,
        };
      })
      .filter(Boolean) as DisplayCriterion[];
  }

  return SCORE_ROWS
    .filter((row) => row.key in scoreBreakdown)
    .map((row) => ({
      key: row.key,
      label: row.label,
      max_points: 100,
      awarded_points: toScoreNumber(scoreBreakdown[row.key]),
      reason: null,
      evidence: null,
    }));
};

export const getReviewReasons = (scoreBreakdown: unknown) => {
  if (!isRecord(scoreBreakdown) || !Array.isArray(scoreBreakdown.review_reasons)) return [];
  return scoreBreakdown.review_reasons.filter((reason): reason is string => typeof reason === "string" && Boolean(reason.trim()));
};

export const AnalysisPlaceholder = ({ title, body }: { title: string; body: string }) => (
  <div className="border border-border bg-secondary/35 px-4 py-3">
    <div className="micro-label mb-1.5">{title}</div>
    <div className="text-sm text-stone leading-relaxed">{body}</div>
  </div>
);
