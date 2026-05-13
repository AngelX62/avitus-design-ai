import {
  duplicateKeyForLead,
  getMissingFoundationFields,
  hasNoFirstFollowUpRisk,
  type SignalTone,
} from "@/lib/leadSignals";

export type InboxSignalKey =
  | "needs_review"
  | "going_cold"
  | "follow_ups_due"
  | "missing_info"
  | "duplicates"
  | "status_health"
  | "import_rows";

export type InboxSignalDescriptor = {
  key: InboxSignalKey;
  label: string;
  tone: SignalTone;
};

export const INBOX_SIGNALS: InboxSignalDescriptor[] = [
  { key: "needs_review", label: "Needs review", tone: "sage" },
  { key: "going_cold", label: "Going cold", tone: "attn" },
  { key: "follow_ups_due", label: "Follow-ups due", tone: "attn" },
  { key: "missing_info", label: "Missing info", tone: "stone" },
  { key: "duplicates", label: "Duplicates", tone: "sage" },
  { key: "status_health", label: "No follow-up", tone: "attn" },
  { key: "import_rows", label: "Import rows", tone: "stone" },
];

const INBOX_SIGNAL_KEY_SET: Set<string> = new Set(INBOX_SIGNALS.map((s) => s.key));

export const isInboxSignalKey = (value: string | null | undefined): value is InboxSignalKey =>
  typeof value === "string" && INBOX_SIGNAL_KEY_SET.has(value);

const GOING_COLD_THRESHOLD_MS = 14 * 86_400_000;
const isOpenStatus = (status: string | null | undefined) => status !== "won" && status !== "lost";

type InboxFilterLead = {
  full_name?: string | null;
  status?: string | null;
  source?: string | null;
  email?: string | null;
  phone?: string | null;
  budget_range?: string | null;
  timeline?: string | null;
  project_type?: string | null;
  property_type?: string | null;
  location?: string | null;
  created_at?: string | null;
  reminder_at?: string | null;
  last_contacted_at?: string | null;
};

export const buildDuplicateKeySet = (leads: InboxFilterLead[]) => {
  const counts = new Map<string, number>();
  for (const lead of leads) {
    const key = duplicateKeyForLead(lead);
    if (key) counts.set(key, (counts.get(key) || 0) + 1);
  }
  return new Set(Array.from(counts.entries()).filter(([, count]) => count > 1).map(([key]) => key));
};

export const matchesInboxSignal = (
  lead: InboxFilterLead,
  now: Date,
  key: InboxSignalKey,
  duplicateKeys: Set<string> = new Set(),
): boolean => {
  const nowMs = now.getTime();
  switch (key) {
    case "needs_review":
      return lead.status === "needs_review";
    case "going_cold": {
      if (!isOpenStatus(lead.status) || !lead.last_contacted_at) return false;
      const last = new Date(lead.last_contacted_at).getTime();
      return Number.isFinite(last) && nowMs - last > GOING_COLD_THRESHOLD_MS;
    }
    case "follow_ups_due": {
      if (!lead.reminder_at) return false;
      const due = new Date(lead.reminder_at).getTime();
      return Number.isFinite(due) && due <= nowMs;
    }
    case "missing_info":
      return isOpenStatus(lead.status) && getMissingFoundationFields(lead).length > 0;
    case "duplicates": {
      const duplicateKey = duplicateKeyForLead(lead);
      return Boolean(duplicateKey && duplicateKeys.has(duplicateKey));
    }
    case "status_health":
      return hasNoFirstFollowUpRisk(lead, now);
    case "import_rows":
      return lead.source === "imported" && lead.status === "new";
    default:
      return false;
  }
};
