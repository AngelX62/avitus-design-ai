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

export const temperatureTone = (t?: string | null): "hot" | "warm" | "cold" | "neutral" => {
  switch (t) {
    case "hot":  return "hot";
    case "warm": return "warm";
    case "cold": return "cold";
    default:     return "neutral";
  }
};

// Legacy class helper kept for any old call sites.
export const temperatureClass = (t?: string | null) => {
  switch (t) {
    case "hot":  return "bg-accent text-background border-accent";
    case "warm": return "bg-transparent text-foreground border-foreground";
    case "cold": return "bg-transparent text-graphite border-rule";
    default:     return "bg-transparent text-graphite border-rule";
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
