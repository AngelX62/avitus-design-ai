export const AI_NOT_CONFIGURED_STATUS = "not_configured";

declare const Deno: { env: { get: (key: string) => string | undefined } };

type EnvLookup = (key: string) => string | null | undefined;

export const isOpenAIKeyConfigured = (lookup: EnvLookup) => Boolean(lookup("OPENAI_API_KEY")?.trim());

export const isOpenAIConfigured = () => isOpenAIKeyConfigured((key) => Deno.env.get(key));

export const analysisStatusForAI = (aiAvailable: boolean) =>
  aiAvailable ? "pending" : AI_NOT_CONFIGURED_STATUS;

export const createNoAIAnalysisResult = () => ({
  ai_available: false as const,
  status: AI_NOT_CONFIGURED_STATUS,
  fit_score: null,
  classification: null,
  temperature: null,
  score_breakdown: null,
});

const sourceLabel = (source?: string | null) => {
  switch (source) {
    case "whatsapp":
      return "WhatsApp lead";
    case "instagram":
      return "Instagram lead";
    case "email":
      return "Email lead";
    case "sms":
      return "SMS lead";
    default:
      return "Pasted lead";
  }
};

export const createFallbackExtractedLead = (rawText: string, source?: string | null) => ({
  full_name: sourceLabel(source),
  email: null,
  phone: null,
  project_type: null,
  property_type: null,
  location: null,
  budget_range: null,
  timeline: null,
  style_preference: null,
  urgency: null,
  missing_info: [
    "Client name",
    "Email or phone number",
    "Budget range",
    "Timeline",
    rawText.trim().length > 0 ? "Confirm the pasted details manually" : "Original message",
  ],
});
