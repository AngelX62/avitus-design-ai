import type { LeadStatusDatum } from "@/lib/leadStats";

const barWidth = (count: number, maxCount: number) =>
  maxCount > 0 ? `${(count / maxCount) * 100}%` : "0%";

const dominantCaption = (data: LeadStatusDatum[]): string | null => {
  const total = data.reduce((sum, row) => sum + row.count, 0);
  if (total === 0) return null;

  const sorted = [...data].sort((a, b) => b.count - a.count);
  const top = sorted[0];
  if (!top || top.count === 0) return null;

  const ratio = top.count / total;

  if (top.key === "new" && ratio > 0.5) {
    return "Most leads are still New. Qualify them before they cool.";
  }
  if (top.key === "needs_review" && ratio > 0.3) {
    return "Several leads need review. Open the inbox to triage.";
  }

  const won = data.find((row) => row.key === "won")?.count ?? 0;
  if (won > 0) {
    const wonPercent = Math.round((won / total) * 100);
    return `${wonPercent}% conversion to Won so far this view.`;
  }

  return null;
};

export const LeadStatusChart = ({ data }: { data: LeadStatusDatum[] }) => {
  const maxCount = Math.max(0, ...data.map((row) => row.count));
  const caption = dominantCaption(data);

  return (
    <section className="bg-hairline bg-top bg-no-repeat bg-[length:100%_1px] pt-8 pb-2 mt-2 px-1">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-md">
          <div className="micro-label mb-2">LEAD STATUS FUNNEL</div>
          <h2 className="font-serif text-2xl text-ink leading-none">Where leads stand.</h2>
          {caption && (
            <p className="mt-3 text-sm text-ink leading-relaxed">{caption}</p>
          )}
        </div>
        <div className="text-xs text-stone leading-relaxed sm:max-w-[180px] sm:text-right">
          Counts by current status.
        </div>
      </div>

      <div className="space-y-4" role="list" aria-label="Lead status counts">
        {data.map((row) => {
          const hasCount = row.count > 0;

          return (
            <div key={row.key} role="listitem">
              <div className="mb-2 flex items-baseline justify-between gap-4">
                <div className="min-w-0 text-sm leading-snug text-ink">{row.label}</div>
                <div className="shrink-0 font-mono text-xs tabular-nums text-stone">{row.count}</div>
              </div>
              <div className="h-2 w-full overflow-hidden bg-secondary rounded-sm" aria-hidden="true">
                <div
                  className={`h-full transition-[width] duration-700 ease-out ${
                    hasCount ? "bg-sage-deep/85" : "bg-transparent"
                  }`}
                  style={{ width: barWidth(row.count, maxCount) }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
