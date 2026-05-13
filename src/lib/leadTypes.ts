import type { Tables } from "@/integrations/supabase/types";

export const LEAD_STATUSES = [
  "new",
  "needs_review",
  "high_fit",
  "contacted",
  "consultation_booked",
  "won",
  "lost",
] as const;

export const LEAD_SOURCES = ["intake_form", "pasted", "imported", "manual"] as const;
export const LEAD_TEMPERATURES = ["hot", "warm", "cold"] as const;
export const LEAD_CLASSIFICATIONS = ["hot", "warm", "cold", "not_fit", "needs_review"] as const;
export const LEAD_URGENCIES = ["low", "medium", "high"] as const;
export const LEAD_ANALYSIS_STATUSES = ["not_configured", "pending", "complete", "failed", "not_started"] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type LeadSource = (typeof LEAD_SOURCES)[number];
export type LeadTemperature = (typeof LEAD_TEMPERATURES)[number];
export type LeadClassification = (typeof LEAD_CLASSIFICATIONS)[number];
export type LeadUrgency = (typeof LEAD_URGENCIES)[number];
export type LeadAnalysisStatus = (typeof LEAD_ANALYSIS_STATUSES)[number];

export type LeadAnalysisStatusCopy = {
  title: string;
  body: string;
};

export type LegacyScoreBreakdown = {
  budget_fit: number;
  timeline_fit: number;
  location_fit: number;
  project_type_fit: number;
  decision_maker: number;
  clarity: number;
};

export type WeightedScoreCriterion = {
  key: keyof LegacyScoreBreakdown;
  label: string;
  max_points: number;
  awarded_points: number;
  reason: string;
  evidence: string | null;
  source_field: string;
};

export type WeightedScoreBreakdown = {
  version: string;
  total_score: number;
  classification: LeadClassification;
  criteria: WeightedScoreCriterion[];
  review_reasons?: string[];
};

export type LeadAnalysis = {
  fit_score: number;
  classification: LeadClassification;
  temperature: LeadTemperature | null;
  urgency: LeadUrgency;
  summary: string;
  next_action: string;
  suggested_followup: string;
  missing_info: string[];
  score_breakdown: WeightedScoreBreakdown;
  red_flags: string[];
};

export const getLeadAnalysisStatusCopy = (
  status?: string | null,
  error?: string | null,
): LeadAnalysisStatusCopy => {
  switch (status) {
    case "complete":
      return {
        title: "Analysis complete",
        body: "Stored analysis is available for this lead.",
      };
    case "failed":
      return {
        title: "Analysis unavailable",
        body: error || "The lead is still usable. Review the details manually or try analysis again later.",
      };
    case "pending":
    case "not_started":
      return {
        title: "Pending analysis",
        body: "Analysis has not completed yet. You can still review, edit, and follow up manually.",
      };
    case "not_configured":
    default:
      return {
        title: "Analysis not enabled yet",
        body: "This lead is ready for manual review and will not show a score until server-side analysis is enabled.",
      };
  }
};

export type Studio = Tables<"studios">;
export type StudioMembership = Tables<"studio_memberships">;
export type Lead = Tables<"leads">;
export type Project = Tables<"projects">;

export type ActiveStudio = Studio & {
  role: StudioMembership["role"];
};

export const STATUS_LABELS: Record<string, string> = {
  new: "New",
  needs_review: "Needs Review",
  high_fit: "High-Fit",
  contacted: "Contacted",
  consultation_booked: "Consultation Booked",
  won: "Won",
  lost: "Lost",
  qualified: "Qualified",
  proposal: "Proposal",
};

export const SOURCE_LABELS: Record<string, string> = {
  intake_form: "Intake Form",
  pasted: "Pasted Message",
  imported: "Imported",
  manual: "Manual",
};

export const CLASSIFICATION_LABELS: Record<string, string> = {
  hot: "Hot",
  warm: "Warm",
  cold: "Cold",
  not_fit: "Not Fit",
  needs_review: "Needs Review",
};

const everyOtherLeadStatus = (status: LeadStatus) =>
  LEAD_STATUSES.filter((candidate) => candidate !== status);

export const VALID_STATUS_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  new: everyOtherLeadStatus("new"),
  needs_review: everyOtherLeadStatus("needs_review"),
  high_fit: everyOtherLeadStatus("high_fit"),
  contacted: everyOtherLeadStatus("contacted"),
  consultation_booked: everyOtherLeadStatus("consultation_booked"),
  won: everyOtherLeadStatus("won"),
  lost: everyOtherLeadStatus("lost"),
};

export const canTransitionLeadStatus = (from: LeadStatus, to: LeadStatus) =>
  from === to || VALID_STATUS_TRANSITIONS[from].includes(to);
