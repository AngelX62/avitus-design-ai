import { ReactNode } from "react";

/**
 * Editorial KPI — large serif numeral with a micro-label and optional italic caption.
 * `size`:
 *   - "hero" → 80px numeral, used once per page
 *   - "default" → 44px numeral, used in hairline-divided sibling rows
 */
export const KPI = ({
  label,
  value,
  caption,
  size = "default",
  accent = false,
}: {
  label: string;
  value: number | string;
  caption?: ReactNode;
  size?: "hero" | "default";
  accent?: boolean;
}) => {
  const numeralClass =
    size === "hero"
      ? "serif-numeral text-[80px] md:text-[96px]"
      : "serif-numeral text-[44px] md:text-[52px]";

  return (
    <div className="flex flex-col gap-3">
      <div className="micro-label">{label}</div>
      <div className={`${numeralClass} ${accent ? "text-terracotta" : ""}`}>
        {value}
      </div>
      {caption && (
        <div className="italic-serif text-[15px] leading-snug">{caption}</div>
      )}
    </div>
  );
};