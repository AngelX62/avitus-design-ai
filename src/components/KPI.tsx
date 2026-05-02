import { ReactNode } from "react";

/**
 * Atelier KPI — Inter tabular numeral with micro-label and optional delta caption.
 */
export const KPI = ({
  label,
  value,
  caption,
  size = "default",
  accent = false,
  delta,
  deltaTone = "neutral",
}: {
  label: string;
  value: number | string;
  caption?: ReactNode;
  size?: "hero" | "default";
  accent?: boolean;
  delta?: string;
  deltaTone?: "up" | "down" | "neutral";
}) => {
  const numeralClass =
    size === "hero"
      ? "serif-numeral text-[72px] md:text-[96px]"
      : "serif-numeral text-[44px] md:text-[56px]";

  const deltaColor =
    deltaTone === "up" ? "text-accent" : deltaTone === "down" ? "text-graphite" : "text-graphite";

  return (
    <div className="flex flex-col gap-3">
      <div className="micro-label">{label}</div>
      <div className={`${numeralClass} ${accent ? "text-accent" : ""}`}>{value}</div>
      {delta && <div className={`text-[12px] tabular ${deltaColor}`}>{delta}</div>}
      {caption && <div className="text-[13px] text-graphite leading-snug">{caption}</div>}
    </div>
  );
};
