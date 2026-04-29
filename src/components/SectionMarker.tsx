import { ReactNode } from "react";

/**
 * Editorial section marker — e.g. "§ 01 OVERVIEW"
 * Used at the top of pages and between major sections.
 */
export const SectionMarker = ({
  number,
  label,
  trailing,
}: {
  number?: string | number;
  label: string;
  trailing?: ReactNode;
}) => (
  <div className="flex items-baseline justify-between gap-4">
    <div className="micro-label flex items-baseline gap-3">
      <span className="text-ink/60">§</span>
      {number !== undefined && (
        <span className="text-ink">{String(number).padStart(2, "0")}</span>
      )}
      <span>{label}</span>
    </div>
    {trailing}
  </div>
);