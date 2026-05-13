import { analysisStatusForAI } from "./aiAvailability.ts";

export type ManualLeadPayload = {
  studio_id: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  project_type?: string | null;
  location?: string | null;
  budget_range?: string | null;
  brief?: string | null;
};

const clean = (value?: string | null) => {
  const text = value?.trim();
  return text ? text : null;
};

export const manualLeadPlaceholderEmail = (suffix: string) => `unknown+${suffix}@manual.avitus`;

export const buildManualLeadInsert = (
  payload: ManualLeadPayload,
  userId: string,
  aiAvailable: boolean,
  fallbackSuffix = crypto.randomUUID().slice(0, 8),
) => {
  const email = clean(payload.email);
  const brief = clean(payload.brief);

  return {
    studio_id: payload.studio_id,
    full_name: payload.full_name.trim(),
    email: email || manualLeadPlaceholderEmail(fallbackSuffix),
    phone: clean(payload.phone),
    project_type: clean(payload.project_type),
    location: clean(payload.location),
    budget_range: clean(payload.budget_range),
    brief,
    raw_inquiry: brief,
    source: "manual",
    created_by: userId,
    ai_analysis_status: analysisStatusForAI(aiAvailable),
    fit_score: null,
    classification: null,
    temperature: null,
    score_breakdown: null,
  };
};
