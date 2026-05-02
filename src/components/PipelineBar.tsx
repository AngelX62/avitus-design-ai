export const PipelineBar = ({
  label,
  value,
  pct,
  accent = false,
}: {
  label: string;
  value: number | string;
  pct: number; // 0-100
  accent?: boolean;
}) => (
  <div>
    <div className="flex justify-between items-baseline text-[12px]">
      <div className="text-foreground">{label}</div>
      <div className="tabular text-graphite">{value}</div>
    </div>
    <div className="h-[6px] bg-rule mt-2">
      <div
        className={`h-full ${accent ? "bg-accent" : "bg-foreground"}`}
        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
      />
    </div>
  </div>
);
