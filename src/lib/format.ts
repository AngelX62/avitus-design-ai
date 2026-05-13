export { CLASSIFICATION_LABELS, SOURCE_LABELS, STATUS_LABELS } from "./leadTypes";

export const formatRelative = (iso?: string | null): string => {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
};

export const formatBudget = (budget?: string | null, currency?: string | null) => {
  if (!budget) return "";
  if (!currency || currency === "Other") return budget;
  return budget.includes(currency) ? budget : `${currency} ${budget}`;
};

export const temperatureClass = (t?: string | null) => {
  switch (t) {
    case "hot": return "bg-moss-soft text-pine border-pine/20";
    case "warm": return "bg-stone-100 text-stone-800 border-stone-200";
    case "cold": return "bg-slate-100 text-slate-700 border-slate-200";
    default: return "bg-secondary text-stone border-border";
  }
};

export const classificationClass = (classification?: string | null) => {
  switch (classification) {
    case "hot":
    case "warm":
    case "cold":
      return temperatureClass(classification);
    case "not_fit":
      return "bg-stone-100 text-stone-600 border-stone-200";
    case "needs_review":
      return "bg-attn-soft text-attn border-attn-rule/40";
    default:
      return "bg-secondary text-stone border-border";
  }
};
