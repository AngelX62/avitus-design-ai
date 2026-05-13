import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Sparkles, CheckCircle2, Clock, MessageSquare, FileText } from "lucide-react";
import { LeadSignals } from "@/components/LeadSignals";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CLASSIFICATION_LABELS, SOURCE_LABELS, STATUS_LABELS, classificationClass, formatRelative } from "@/lib/format";
import { computeSignals, isPlaceholderEmail, type LeadShape, type SignalTone } from "@/lib/leadSignals";
import { type LeadStatus } from "@/lib/leadTypes";
import { REVEAL_DURATION, REVEAL_EASE } from "./lead-detail-utils";
import { ReminderMenu } from "./ReminderMenu";

const STATUSES: LeadStatus[] = ["new", "needs_review", "high_fit", "contacted", "consultation_booked", "won", "lost"];

type AnalysisState = { title: string; body: string };

type LeadControlDeckProps = {
  lead: any;
  now: Date;
  scoring: boolean;
  canRunAnalysis: boolean;
  aiUnavailable: boolean;
  analysisPending: boolean;
  analysisState: AnalysisState;
  manualReview: AnalysisState | null;
  missingInfo: string[];
  onRunAi: () => void;
  onMarkContacted: () => Promise<void> | void;
  onSetReminder: (days: number) => void;
  onOpenFollowup: () => void;
  onUpdateStatus: (status: LeadStatus) => void;
};

const railFromTone = (tone: SignalTone | null) => {
  if (tone === "attn") return "border-l-attn shadow-attention-lit";
  if (tone === "sage") return "border-l-sage shadow-rest-lit";
  return "border-l-stone/60 shadow-rest-lit";
};

const ToneRipple = ({ pulseKey }: { pulseKey: number }) => {
  const reduced = useReducedMotion();
  if (reduced || pulseKey === 0) return null;
  return (
    <motion.span
      key={pulseKey}
      aria-hidden
      initial={{ scale: 1, opacity: 0.45 }}
      animate={{ scale: 1.45, opacity: 0 }}
      transition={{ duration: 0.6, ease: REVEAL_EASE }}
      className="pointer-events-none absolute inset-0 bg-sage/40"
    />
  );
};

export const LeadControlDeck = ({
  lead,
  now,
  scoring,
  canRunAnalysis,
  aiUnavailable,
  analysisPending,
  analysisState,
  manualReview,
  missingInfo,
  onRunAi,
  onMarkContacted,
  onSetReminder,
  onOpenFollowup,
  onUpdateStatus,
}: LeadControlDeckProps) => {
  const reduced = useReducedMotion();
  const [pulseKey, setPulseKey] = useState(0);

  const leadForSignals: LeadShape = lead;
  const signals = computeSignals(leadForSignals, now);
  const dominantTone: SignalTone | null = signals[0]?.tone ?? null;
  const railClass = railFromTone(dominantTone);
  const displayClassification = lead.classification || lead.temperature;
  const sourceLabel = SOURCE_LABELS[lead.source] || lead.source;
  const displayEmail = isPlaceholderEmail(lead.email) ? null : lead.email;
  const contactLine = [displayEmail, lead.phone].filter(Boolean).join(" · ");

  const reveal = (delay: number) =>
    reduced
      ? undefined
      : {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: REVEAL_DURATION, delay, ease: REVEAL_EASE },
        };

  const handleMarkContacted = async () => {
    setPulseKey((value) => value + 1);
    await onMarkContacted();
  };

  return (
    <section className={`relative mb-6 border border-border border-l-[3px] bg-card ${railClass}`}>
      <motion.div aria-hidden {...reveal(0)} className={`h-[3px] w-12 absolute -left-[3px] top-0 ${
        dominantTone === "attn" ? "bg-attn" : dominantTone === "sage" ? "bg-sage" : "bg-stone/60"
      }`} />

      <div className="p-7 md:p-9">
        {/* Identity row */}
        <motion.div {...reveal(0.08)} className="flex flex-wrap items-center gap-3 mb-3">
          <span className="micro-label">{sourceLabel}</span>
          <AnimatePresence mode="wait">
            {displayClassification && (
              <motion.span
                key={displayClassification}
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -2 }}
                transition={{ duration: 0.24, ease: REVEAL_EASE }}
                className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border ${classificationClass(displayClassification)}`}
              >
                {CLASSIFICATION_LABELS[displayClassification] || displayClassification}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.h1 {...reveal(0.16)} className="font-serif text-4xl md:text-5xl text-ink leading-tight">
          {lead.full_name}
        </motion.h1>
        <motion.div {...reveal(0.16)} className="text-stone text-sm mt-2">
          {contactLine || "Missing contact details"}
        </motion.div>

        {/* Signals row */}
        <motion.div {...reveal(0.24)} className="mt-5 min-h-[22px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={signals.map((s) => s.key).join("|") || "empty"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.24, ease: REVEAL_EASE }}
            >
              {signals.length > 0 ? (
                <LeadSignals lead={leadForSignals} now={now} />
              ) : (
                <span className="text-xs text-stone">No active signals on this lead.</span>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Fit + score band */}
        <motion.div {...reveal(0.28)} className="mt-7 pt-6 border-t border-border flex flex-wrap items-baseline justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="micro-label mb-2 flex items-center gap-2">
              <MessageSquare size={11} strokeWidth={1.5} /> NEXT ACTION
            </div>
            {lead.ai_next_action ? (
              <p className="text-[15px] text-ink leading-relaxed max-w-2xl">{lead.ai_next_action}</p>
            ) : (
              <p className="text-sm text-stone leading-relaxed max-w-2xl">
                {aiUnavailable
                  ? "Analysis is not enabled yet — review this lead manually and pick the next step."
                  : analysisPending
                  ? "A recommended next step will appear here once analysis runs."
                  : "No recommendation yet. Re-analyse to generate one, or choose a next step manually."}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {lead.fit_score != null ? (
              <>
                <div className="flex items-baseline gap-3">
                  <div className="font-serif text-6xl text-pine leading-none tabular-nums">{lead.fit_score}</div>
                  <div className="micro-label text-stone">FIT</div>
                </div>
                {canRunAnalysis && (
                  <button
                    type="button"
                    onClick={onRunAi}
                    disabled={scoring}
                    className="text-[10px] uppercase tracking-[0.18em] text-stone hover:text-pine disabled:opacity-50"
                  >
                    {scoring ? "Re-analysing…" : "Re-analyse"}
                  </button>
                )}
              </>
            ) : canRunAnalysis ? (
              <button
                type="button"
                onClick={onRunAi}
                disabled={scoring}
                className="flex items-center gap-2 px-4 py-2.5 border border-border bg-card text-xs uppercase tracking-[0.18em] hover:bg-secondary shadow-rest-lit hover:shadow-hover-lit transition-all disabled:opacity-50"
              >
                <Sparkles size={13} strokeWidth={1.5} /> {scoring ? "Analysing…" : "Analyse with AI"}
              </button>
            ) : (
              <div className="micro-label text-stone text-right">
                {aiUnavailable ? "MANUAL REVIEW" : analysisPending ? "PENDING ANALYSIS" : "NO SCORE"}
              </div>
            )}
          </div>
        </motion.div>

        {manualReview && (
          <motion.div {...reveal(0.32)} className="mt-5 border border-border bg-secondary/35 px-4 py-3">
            <div className="micro-label mb-1.5">{manualReview.title}</div>
            <div className="text-sm text-stone leading-relaxed">{manualReview.body}</div>
          </motion.div>
        )}

        {/* Action bar */}
        <motion.div {...reveal(0.4)} className="mt-7 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleMarkContacted}
            className="relative inline-flex items-center gap-2 px-4 py-2.5 bg-pine text-ivory text-[10px] uppercase tracking-[0.18em] shadow-rest-lit hover:bg-pine/95 hover:shadow-hover-lit transition-all overflow-hidden"
          >
            <ToneRipple pulseKey={pulseKey} />
            <CheckCircle2 size={13} strokeWidth={1.5} /> Mark Contacted
          </button>
          <ReminderMenu onPick={onSetReminder} />
          <button
            type="button"
            onClick={onOpenFollowup}
            className="flex items-center gap-2 px-3.5 py-2.5 border border-border bg-card text-[10px] uppercase tracking-[0.18em] text-ink shadow-rest-lit hover:bg-secondary hover:shadow-hover-lit transition-all"
          >
            <FileText size={13} strokeWidth={1.5} /> Open follow-up
          </button>
        </motion.div>

        <AnimatePresence mode="wait">
          {lead.reminder_at && (
            <motion.div
              key={lead.reminder_at}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.32, ease: REVEAL_EASE }}
              className="mt-3 inline-flex items-center gap-2 px-2.5 py-1 border border-border bg-secondary/60 text-xs text-stone"
            >
              <Clock size={11} strokeWidth={1.5} className="text-stone" />
              Reminder set for {new Date(lead.reminder_at).toLocaleString()}
            </motion.div>
          )}
        </AnimatePresence>

        {missingInfo.length > 0 && (
          <motion.div {...reveal(0.44)} className="mt-6 border border-attn-rule/40 bg-attn-soft/30 border-l-[3px] border-l-attn px-4 py-3">
            <div className="micro-label mb-2 flex items-center gap-2 text-attn">
              <MessageSquare size={11} strokeWidth={1.5} /> ASK IN YOUR NEXT MESSAGE
            </div>
            <ul className="space-y-1 text-sm text-ink">
              {missingInfo.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden className="text-attn">·</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>

      {/* Status footer */}
      <motion.div {...reveal(0.48)} className="border-t border-border bg-background/40 px-7 md:px-9 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="micro-label">STATUS</div>
          <Select
            value={lead.status}
            onValueChange={(value) => onUpdateStatus(value as LeadStatus)}
          >
            <SelectTrigger className="w-[220px] bg-transparent border-border rounded-none focus:ring-0 focus:ring-offset-0 focus:border-pine h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s] || s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {lead.last_contacted_at && (
          <AnimatePresence mode="wait">
            <motion.div
              key={lead.last_contacted_at}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.24, ease: REVEAL_EASE }}
              className="text-xs text-stone"
            >
              Last contacted {formatRelative(lead.last_contacted_at)}
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>
    </section>
  );
};
