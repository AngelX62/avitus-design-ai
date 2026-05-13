import { Link } from "react-router-dom";
import { Sparkles, ArrowUpRight } from "lucide-react";
import { LeadSignals } from "@/components/LeadSignals";
import { OwnerStatePanel } from "@/components/OwnerStatePanel";
import {
  CLASSIFICATION_LABELS,
  SOURCE_LABELS,
  STATUS_LABELS,
  formatRelative,
} from "@/lib/format";
import type { PriorityLead } from "@/lib/leadPriority";
import type { SignalTone } from "@/lib/leadSignals";

const signalToneClass: Record<SignalTone, string> = {
  attn: "text-attn",
  sage: "text-sage-deep",
  stone: "text-stone",
};

type Props = {
  leads: PriorityLead[];
  now: Date;
};

const statusOrClassificationLabel = (lead: PriorityLead): string | null => {
  if (lead.classification && CLASSIFICATION_LABELS[lead.classification]) {
    return CLASSIFICATION_LABELS[lead.classification];
  }
  if (lead.status && STATUS_LABELS[lead.status]) {
    return STATUS_LABELS[lead.status];
  }
  return null;
};

const lastActivityLabel = (lead: PriorityLead): string => {
  if (lead.last_contacted_at) return `${formatRelative(lead.last_contacted_at)} since contact`;
  return `${formatRelative(lead.created_at)} · captured`;
};

export const PriorityLeadsPanel = ({ leads, now }: Props) => (
  <section className="bg-hairline bg-top bg-no-repeat bg-[length:100%_1px] pt-7 mt-2 mb-7">
    <div className="flex items-baseline justify-between mb-2 px-1">
      <div className="micro-label flex items-center gap-2">
        <Sparkles size={11} /> PRIORITY LEADS
      </div>
      <Link to="/leads" className="micro-label text-stone hover:text-sage-deep transition-colors no-underline">
        VIEW INBOX →
      </Link>
    </div>
    <h2 className="font-serif text-2xl text-ink leading-none mb-4 px-1">
      Worth your attention this morning.
    </h2>

    {leads.length === 0 ? (
      <OwnerStatePanel
        eyebrow="PRIORITY LEADS"
        body="No priority leads right now. New urgent items will appear here when a lead needs attention."
      />
    ) : (
      <div className="space-y-3">
        {leads.map((lead) => {
          const subline = [
            lead.source ? SOURCE_LABELS[lead.source] ?? "Other" : null,
            statusOrClassificationLabel(lead),
            lastActivityLabel(lead),
          ].filter(Boolean) as string[];

          const matterParts = [lead.project_type, lead.budget_range].filter(Boolean) as string[];

          return (
            <Link
              key={lead.id}
              to={`/leads/${lead.id}`}
              className="group block border border-border bg-card px-5 py-4 no-underline hover:border-sage/50 hover:shadow-rest transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className={`text-[10px] uppercase tracking-[0.18em] mb-1.5 ${signalToneClass[lead.topSignalTone]}`}>
                    {lead.topSignalLabel}
                  </div>
                  <div className="font-serif text-lg text-ink leading-tight truncate">{lead.full_name}</div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-stone mt-1.5">
                    {subline.map((part, i) => (
                      <span key={i}>
                        {i > 0 && <span aria-hidden className="mx-2 text-stone/45">·</span>}
                        {part}
                      </span>
                    ))}
                  </div>
                  {matterParts.length > 0 && (
                    <div className="text-[13px] text-ink mt-1 truncate">
                      {matterParts.join(" · ")}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-sm text-sage-deep tabular-nums min-w-[1.75rem] text-right">
                    {lead.fit_score ?? "—"}
                  </div>
                  <ArrowUpRight
                    size={15}
                    strokeWidth={1.25}
                    aria-hidden
                    className="text-stone group-hover:text-sage-deep transition-colors"
                  />
                </div>
              </div>

              <LeadSignals lead={lead} now={now} className="mt-2.5" />

              {lead.ai_next_action && (
                <div className="mt-3 flex items-baseline gap-2 text-xs leading-relaxed">
                  <span className="micro-label text-stone shrink-0">NEXT STEP</span>
                  <span className="text-ink line-clamp-2">{lead.ai_next_action}</span>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    )}
  </section>
);
