import { computeSignals, tonePriority, type SignalTone } from "@/lib/leadSignals";
import type { LeadStatsLead } from "@/lib/leadStats";

export type PriorityLead = LeadStatsLead & {
  topSignalTone: SignalTone;
  topSignalLabel: string;
};

export const selectPriorityLeads = (
  leads: LeadStatsLead[],
  now: Date,
  exclude: Set<string>,
  limit = 5,
): PriorityLead[] => {
  const candidates = leads
    .filter((lead) => lead.status !== "won" && lead.status !== "lost")
    .filter((lead) => !exclude.has(lead.id))
    .map((lead) => ({ lead, signals: computeSignals(lead, now) }))
    .filter((entry) => entry.signals.length > 0);

  candidates.sort((a, b) => {
    const toneDelta = tonePriority[a.signals[0].tone] - tonePriority[b.signals[0].tone];
    if (toneDelta !== 0) return toneDelta;
    const aFit = a.lead.fit_score ?? -1;
    const bFit = b.lead.fit_score ?? -1;
    if (bFit !== aFit) return bFit - aFit;
    const aTs = new Date(a.lead.last_contacted_at ?? a.lead.created_at).getTime();
    const bTs = new Date(b.lead.last_contacted_at ?? b.lead.created_at).getTime();
    return bTs - aTs;
  });

  return candidates.slice(0, limit).map(({ lead, signals }) => ({
    ...lead,
    topSignalTone: signals[0].tone,
    topSignalLabel: signals[0].label,
  }));
};
