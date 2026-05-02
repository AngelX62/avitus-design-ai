import { ReactNode } from "react";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Atelier section marker — e.g. "A · OVERVIEW"
 * Accepts a number (1-based) which is rendered as a letter (A, B, C…).
 */
export const SectionMarker = ({
  number,
  label,
  trailing,
}: {
  number?: string | number;
  label: string;
  trailing?: ReactNode;
}) => {
  let prefix: string | undefined;
  if (typeof number === "number") prefix = LETTERS[(number - 1) % 26];
  else if (typeof number === "string") prefix = number;

  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-foreground pb-2">
      <div className="micro-label flex items-baseline gap-2 text-foreground">
        {prefix && <span>{prefix}</span>}
        {prefix && <span className="text-graphite">·</span>}
        <span className="text-graphite">{label}</span>
      </div>
      {trailing}
    </div>
  );
};
