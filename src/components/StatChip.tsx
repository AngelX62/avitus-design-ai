import { cn } from "@/lib/utils";

type Tone = "hot" | "warm" | "cold" | "neutral" | "ink";

const styles: Record<Tone, string> = {
  hot: "bg-accent text-background border-accent",
  warm: "bg-transparent text-foreground border-foreground",
  cold: "bg-transparent text-graphite border-rule",
  neutral: "bg-transparent text-graphite border-rule",
  ink: "bg-foreground text-background border-foreground",
};

export const StatChip = ({
  label,
  tone = "neutral",
  className,
}: {
  label: string;
  tone?: Tone;
  className?: string;
}) => (
  <span
    className={cn(
      "inline-flex items-center text-[10px] uppercase tracking-[0.18em] px-1.5 py-0.5 border leading-tight",
      styles[tone],
      className
    )}
  >
    {label}
  </span>
);
