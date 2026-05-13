import { computeSignals, type LeadShape, type SignalTone } from "@/lib/leadSignals";

const toneClass: Record<SignalTone, string> = {
  attn: "border-attn-rule/40 bg-attn-soft text-attn",
  sage: "border-sage/40 bg-sage-soft text-sage-deep",
  stone: "border-border bg-secondary text-stone",
};

type LeadSignalsProps = {
  lead: LeadShape;
  now: Date;
  className?: string;
  max?: number;
};

export const LeadSignals = ({ lead, now, className = "", max }: LeadSignalsProps) => {
  const computed = computeSignals(lead, now);
  const signals = typeof max === "number" ? computed.slice(0, max) : computed;
  if (signals.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {signals.map((signal) => (
        <span
          key={signal.key}
          className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 border ${toneClass[signal.tone]}`}
        >
          {signal.label}
        </span>
      ))}
    </div>
  );
};
