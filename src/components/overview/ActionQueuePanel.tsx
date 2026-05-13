import { Link } from "react-router-dom";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import type { ActionQueueItem, ActionQueueItemKind } from "@/lib/actionQueue";
import { ACTION_RISK_TIER_LABELS } from "@/lib/actionTiers";

type ActionQueuePanelProps = {
  items: ActionQueueItem[];
};

type RowTone = "attn" | "sage" | "stone";

const kindMeta: Record<ActionQueueItemKind, { label: string; tone: RowTone }> = {
  follow_up_due: { label: "Overdue", tone: "attn" },
  going_cold: { label: "Going cold", tone: "attn" },
  needs_review: { label: "Needs review", tone: "sage" },
  missing_info: { label: "Missing info", tone: "stone" },
  possible_duplicate: { label: "Duplicate", tone: "sage" },
  import_review: { label: "Import review", tone: "stone" },
  status_health: { label: "Revenue risk", tone: "attn" },
  low_season: { label: "Pipeline", tone: "stone" },
};

const toneStyles: Record<RowTone, { rail: string; badge: string; hover: string; iconHover: string }> = {
  attn: {
    rail: "border-attn",
    badge: "bg-attn-soft text-attn border-attn-rule/40",
    hover: "hover:bg-attn-soft/40",
    iconHover: "group-hover:text-attn",
  },
  sage: {
    rail: "border-sage",
    badge: "bg-sage-soft text-sage-deep border-sage/40",
    hover: "hover:bg-sage-soft/30",
    iconHover: "group-hover:text-sage-deep",
  },
  stone: {
    rail: "border-stone/60",
    badge: "border-border bg-secondary text-stone",
    hover: "hover:bg-secondary/50",
    iconHover: "group-hover:text-ink",
  },
};

export const ActionQueuePanel = ({ items }: ActionQueuePanelProps) => {
  const hasItems = items.length > 0;

  return (
    <section
      className={`mb-8 border border-border bg-card border-l-[3px] ${
        hasItems ? "border-l-sage shadow-attention-lit" : "border-l-sage/60 shadow-rest-lit"
      }`}
    >
      <div className="flex flex-col gap-2 border-b border-border px-5 py-5 md:flex-row md:items-end md:justify-between md:px-7 md:py-6">
        <div>
          <div className="micro-label mb-3">ACTION QUEUE</div>
          <h2 className="font-serif text-3xl text-ink leading-tight">What needs attention today</h2>
        </div>
        <p className="max-w-md text-xs leading-relaxed text-stone">
          Tier 1 owner-visible signals only. Avitus will not send messages or take external action.
        </p>
      </div>

      {!hasItems ? (
        <div className="flex items-start gap-3 px-5 py-6 md:px-7">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border border-sage/40 bg-sage-soft text-sage-deep">
            <CheckCircle2 size={15} strokeWidth={1.5} />
          </div>
          <div>
            <div className="text-sm text-ink">No urgent owner actions right now.</div>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-stone">
              Due follow-ups, needs-review leads, and deterministic pipeline signals will appear here when they need attention.
            </p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {items.map((item) => {
            const meta = kindMeta[item.kind];
            const tone = toneStyles[meta.tone];
            const content = (
              <>
                <div
                  aria-hidden="true"
                  className={`shrink-0 -my-4 -ml-5 mr-1 w-[3px] border-l-[3px] ${tone.rail} md:-ml-7`}
                />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] ${tone.badge}`}
                    >
                      {meta.label}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.16em] text-stone">
                      {ACTION_RISK_TIER_LABELS[item.tier]}
                    </span>
                  </div>
                  <div>
                    <div className="text-[15px] text-ink leading-snug">{item.title}</div>
                    <p className="mt-1.5 text-xs leading-relaxed text-stone">{item.reason}</p>
                    <p className="mt-1 text-xs leading-relaxed text-stone">
                      <span className="text-ink">Next step:</span> {item.suggestedAction}
                    </p>
                  </div>
                </div>
                {item.href && (
                  <ArrowUpRight
                    size={16}
                    strokeWidth={1.25}
                    className={`mt-1 shrink-0 text-stone transition-colors ${tone.iconHover}`}
                  />
                )}
              </>
            );

            return item.href ? (
              <Link
                key={item.id}
                to={item.href}
                className={`group flex items-start gap-3 px-5 py-4 transition-colors duration-200 md:px-7 md:py-5 ${tone.hover}`}
              >
                {content}
              </Link>
            ) : (
              <div key={item.id} className="flex items-start gap-3 px-5 py-4 md:px-7 md:py-5">
                {content}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
