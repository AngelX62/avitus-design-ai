/**
 * Semantic hairline divider. Replaces boxed cards in editorial layouts.
 */
export const Hairline = ({ className = "" }: { className?: string }) => (
  <div className={`h-px w-full bg-hairline ${className}`} />
);