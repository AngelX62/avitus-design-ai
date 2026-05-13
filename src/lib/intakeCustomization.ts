export const DEFAULT_PROJECT_TYPE_OPTIONS = [
  "Full home",
  "Single room",
  "Renovation",
  "New build",
  "Furnishing only",
];

export const DEFAULT_BUDGET_OPTIONS = [
  "Under $25k",
  "$25k-$50k",
  "$50k-$100k",
  "$100k-$250k",
  "$250k+",
];

export const DEFAULT_INTAKE_THANK_YOU =
  "Your enquiry is with our studio. We read every brief carefully and will be in touch within two business days.";

export type IntakeBudgetSettings = {
  currency?: string | null;
  target_budget_min?: number | null;
  target_budget_max?: number | null;
};

const hasPositiveAmount = (value?: number | null) =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

export const normalizeIntakeOptions = (options?: string[] | null, fallback = DEFAULT_PROJECT_TYPE_OPTIONS) => {
  const seen = new Set<string>();
  const cleaned = (options || [])
    .map((option) => option.trim())
    .filter(Boolean)
    .filter((option) => {
      const key = option.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return cleaned.length > 0 ? cleaned : fallback;
};

export const formatIntakeMoney = (amount: number, currency?: string | null) => {
  if (!currency || currency === "Other") return amount.toLocaleString("en-US");

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount).replace(/\u00a0/g, " ");
  } catch {
    return `${currency} ${amount.toLocaleString("en-US")}`;
  }
};

export const buildBudgetOptions = (settings: IntakeBudgetSettings = {}) => {
  const hasMin = hasPositiveAmount(settings.target_budget_min);
  const hasMax = hasPositiveAmount(settings.target_budget_max);

  if (!hasMin && !hasMax) return DEFAULT_BUDGET_OPTIONS;

  const min = settings.target_budget_min as number;
  const max = settings.target_budget_max as number;

  if (hasMin && hasMax && min < max) {
    const minLabel = formatIntakeMoney(min, settings.currency);
    const maxLabel = formatIntakeMoney(max, settings.currency);
    return [`Under ${minLabel}`, `${minLabel}-${maxLabel}`, `${maxLabel}+`];
  }

  const anchor = hasMin ? min : max;
  const anchorLabel = formatIntakeMoney(anchor, settings.currency);
  return [`Under ${anchorLabel}`, `${anchorLabel}+`];
};

export const getIntakeThankYouMessage = (message?: string | null) =>
  message?.trim() || DEFAULT_INTAKE_THANK_YOU;

export const getIntakeHeroTitle = (businessType?: string | null) =>
  businessType?.toLowerCase().includes("real estate")
    ? "Tell us about your property."
    : "Tell us about your space.";
