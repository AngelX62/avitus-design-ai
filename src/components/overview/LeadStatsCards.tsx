import { Link } from "react-router-dom";
import type { LeadStatsSummary } from "@/lib/leadStats";
import type { InboxSignalKey } from "@/lib/inboxFilters";

type CardTone = "neutral" | "sage" | "attn";

type StatCard = {
  label: string;
  value: number;
  note: string;
  tone: CardTone;
  signalKey: InboxSignalKey;
};

const toneClasses: Record<CardTone, { surface: string; value: string; hover: string }> = {
  neutral: {
    surface: "bg-card",
    value: "text-ink",
    hover: "hover:bg-secondary/40",
  },
  sage: {
    surface: "bg-sage-soft/60",
    value: "text-sage-deep",
    hover: "hover:bg-sage-soft/80",
  },
  attn: {
    surface: "bg-attn-soft/70",
    value: "text-attn",
    hover: "hover:bg-attn-soft/90",
  },
};

export const LeadStatsCards = ({ summary }: { summary: LeadStatsSummary }) => {
  const cards: StatCard[] = [
    {
      label: "Needs review",
      value: summary.needsReviewCount,
      note: "Need first owner review",
      tone: summary.needsReviewCount > 0 ? "sage" : "neutral",
      signalKey: "needs_review",
    },
    {
      label: "Going cold",
      value: summary.goingColdCount,
      note: "No contact in 14+ days",
      tone: summary.goingColdCount > 0 ? "attn" : "neutral",
      signalKey: "going_cold",
    },
    {
      label: "Follow-ups due",
      value: summary.followUpsDue,
      note: "Reminder date passed",
      tone: summary.followUpsDue > 0 ? "attn" : "neutral",
      signalKey: "follow_ups_due",
    },
    {
      label: "Missing info",
      value: summary.missingInfoCount,
      note: "Contact, scope, budget, timeline, or location",
      tone: "neutral",
      signalKey: "missing_info",
    },
    {
      label: "No first follow-up",
      value: summary.noFollowUpRiskCount,
      note: "Open 7+ days with no touch",
      tone: summary.noFollowUpRiskCount > 0 ? "attn" : "neutral",
      signalKey: "status_health",
    },
    {
      label: "Possible duplicates",
      value: summary.possibleDuplicateGroups,
      note: "Same contact or similar lead",
      tone: summary.possibleDuplicateGroups > 0 ? "sage" : "neutral",
      signalKey: "duplicates",
    },
    {
      label: "Import rows needing review",
      value: summary.importRowsNeedingReview,
      note: "New imported rows",
      tone: "neutral",
      signalKey: "import_rows",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-px bg-border border border-border mb-7 shadow-rest-lit overflow-hidden">
      {cards.map((card) => {
        const tone = toneClasses[card.tone];
        return (
          <Link
            key={card.label}
            to={`/leads?signal=${card.signalKey}`}
            className={`relative p-4 min-h-[100px] flex flex-col no-underline transition-colors ${tone.surface} ${tone.hover}`}
          >
            <div className="micro-label mb-3">{card.label}</div>
            <div className={`font-serif text-4xl leading-none ${tone.value}`}>{card.value}</div>
            <div className="text-xs text-stone mt-3 leading-relaxed">{card.note}</div>
          </Link>
        );
      })}
    </div>
  );
};
