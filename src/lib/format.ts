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

export const temperatureClass = (t?: string | null) => {
  switch (t) {
    case "hot": return "bg-amber-100 text-amber-900 border-amber-200";
    case "warm": return "bg-stone-100 text-stone-800 border-stone-200";
    case "cold": return "bg-slate-100 text-slate-700 border-slate-200";
    default: return "bg-secondary text-stone border-border";
  }
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