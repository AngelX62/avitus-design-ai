export type SignalTone = "attn" | "sage" | "stone";

export type Signal = {
  key: string;
  label: string;
  tone: SignalTone;
};

export type LeadShape = {
  full_name?: string | null;
  status?: string | null;
  source?: string | null;
  classification?: string | null;
  fit_score?: number | null;
  email?: string | null;
  phone?: string | null;
  budget_range?: string | null;
  timeline?: string | null;
  project_type?: string | null;
  property_type?: string | null;
  location?: string | null;
  raw_inquiry?: string | null;
  brief?: string | null;
  created_at?: string | null;
  reminder_at?: string | null;
  last_contacted_at?: string | null;
  ai_analysis_status?: string | null;
  possible_duplicate?: boolean | null;
};

const COLD_THRESHOLD_DAYS = 14;
const FIRST_TOUCH_RISK_DAYS = 7;
const HIGH_FIT_SCORE = 75;

export const tonePriority: Record<SignalTone, number> = { attn: 0, sage: 1, stone: 2 };

const isOpenStatus = (status?: string | null) =>
  status !== "won" && status !== "lost";

export const isPlaceholderEmail = (email?: string | null) =>
  Boolean(email && /^unknown\+[^@]+@(intake|import|manual)\.avitus$/i.test(email.trim()));

export const hasUsableContact = (lead: Pick<LeadShape, "email" | "phone">) =>
  Boolean(lead.phone?.trim()) || Boolean(lead.email?.trim() && !isPlaceholderEmail(lead.email));

export const getMissingFoundationFields = (lead: LeadShape): string[] => {
  const missing: string[] = [];

  if (!hasUsableContact(lead)) missing.push("Contact");
  if (!lead.budget_range?.trim()) missing.push("Budget");
  if (!lead.timeline?.trim()) missing.push("Timeline");
  if (!lead.project_type?.trim() && !lead.property_type?.trim()) missing.push("Scope");
  if (!lead.location?.trim()) missing.push("Location");

  return missing;
};

export const duplicateKeyForLead = (lead: Pick<LeadShape, "email" | "phone" | "full_name" | "location"> & { full_name?: string | null }) => {
  const email = lead.email?.trim().toLowerCase();
  if (email && !isPlaceholderEmail(email)) return `email:${email}`;

  const phoneDigits = lead.phone?.replace(/\D/g, "");
  if (phoneDigits && phoneDigits.length >= 6) return `phone:${phoneDigits}`;

  const name = lead.full_name?.trim().toLowerCase().replace(/\s+/g, " ");
  const location = lead.location?.trim().toLowerCase().replace(/\s+/g, " ");
  if (name && location) return `name-location:${name}|${location}`;

  return null;
};

export const hasNoFirstFollowUpRisk = (lead: LeadShape, now: Date) => {
  if (!isOpenStatus(lead.status) || lead.last_contacted_at || !lead.created_at) return false;
  const created = new Date(lead.created_at).getTime();
  if (!Number.isFinite(created)) return false;
  return (now.getTime() - created) / 86_400_000 >= FIRST_TOUCH_RISK_DAYS;
};

export const computeSignals = (lead: LeadShape, now: Date): Signal[] => {
  const signals: Signal[] = [];

  if (lead.reminder_at) {
    const due = new Date(lead.reminder_at);
    if (!Number.isNaN(due.getTime()) && due <= now) {
      signals.push({ key: "follow-up-due", label: "Follow-up due", tone: "attn" });
    }
  }

  if (lead.last_contacted_at && isOpenStatus(lead.status)) {
    const last = new Date(lead.last_contacted_at);
    if (!Number.isNaN(last.getTime())) {
      const days = (now.getTime() - last.getTime()) / 86_400_000;
      if (days > COLD_THRESHOLD_DAYS) {
        signals.push({ key: "going-cold", label: "Going cold", tone: "attn" });
      }
    }
  }

  if (hasNoFirstFollowUpRisk(lead, now)) {
    signals.push({ key: "no-first-follow-up", label: "No follow-up 7d", tone: "attn" });
  }

  if (lead.status === "high_fit" || (lead.fit_score ?? 0) >= HIGH_FIT_SCORE) {
    signals.push({ key: "high-fit", label: "High-fit", tone: "sage" });
  }

  if (lead.status === "needs_review" || lead.classification === "needs_review") {
    signals.push({ key: "needs-review", label: "Needs review", tone: "sage" });
  }

  if (lead.possible_duplicate) {
    signals.push({ key: "possible-duplicate", label: "Possible duplicate", tone: "sage" });
  }

  const missing = getMissingFoundationFields(lead);
  if (missing.includes("Contact")) {
    signals.push({ key: "missing-contact", label: "Missing contact", tone: "stone" });
  } else if (missing.includes("Budget")) {
    signals.push({ key: "missing-budget", label: "Missing budget", tone: "stone" });
  } else if (missing.includes("Timeline")) {
    signals.push({ key: "missing-timeline", label: "Missing timeline", tone: "stone" });
  } else if (missing.includes("Scope")) {
    signals.push({ key: "missing-scope", label: "Missing scope", tone: "stone" });
  } else if (missing.includes("Location")) {
    signals.push({ key: "missing-location", label: "Missing location", tone: "stone" });
  }

  if (lead.source === "imported" && lead.status === "new") {
    signals.push({ key: "import-review", label: "Imported row", tone: "stone" });
  }

  if (lead.ai_analysis_status === "not_configured" && lead.fit_score == null) {
    signals.push({ key: "manual-review", label: "Manual review", tone: "stone" });
  }

  signals.sort((a, b) => tonePriority[a.tone] - tonePriority[b.tone]);
  return signals.slice(0, 3);
};
