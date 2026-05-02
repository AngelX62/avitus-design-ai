/**
 * Atelier hairline divider. Two weights: stone (default) and ink (structural).
 */
export const Hairline = ({
  className = "",
  weight = "stone",
}: {
  className?: string;
  weight?: "stone" | "ink";
}) => (
  <div
    className={`h-px w-full ${
      weight === "ink" ? "bg-foreground" : "bg-rule"
    } ${className}`}
  />
);
