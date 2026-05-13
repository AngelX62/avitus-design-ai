import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import {
  LEAD_TIMELINE_RANGE_OPTIONS,
  type LeadSeasonalityInsight,
  type LeadTimelineDatum,
  type LeadTimelineRange,
} from "@/lib/leadStats";

type LeadsOverTimeChartProps = {
  data: LeadTimelineDatum[];
  range: LeadTimelineRange;
  seasonality: LeadSeasonalityInsight;
  onRangeChange: (range: LeadTimelineRange) => void;
};

type RhythmDatum = LeadTimelineDatum & {
  baseline: number | null;
};

const signalLabels: Record<LeadSeasonalityInsight["status"], string> = {
  low_season: "Quiet period",
  building: "Building",
  steady: "Steady",
  not_enough_data: "Collecting data",
};

const signalClasses: Record<LeadSeasonalityInsight["status"], string> = {
  low_season: "border-attn-rule/40 bg-attn-soft text-attn",
  building: "border-sage/40 bg-sage-soft text-sage-deep",
  steady: "border-border bg-secondary text-stone",
  not_enough_data: "border-border bg-background text-stone",
};

const usePrefersReducedMotion = () => {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(query.matches);

    updatePreference();

    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", updatePreference);
      return () => query.removeEventListener("change", updatePreference);
    }

    query.addListener(updatePreference);
    return () => query.removeListener(updatePreference);
  }, []);

  return reducedMotion;
};

const formatAverage = (value: number) =>
  value % 1 === 0 ? value.toString() : value.toFixed(1);

const SignalTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: RhythmDatum }>;
}) => {
  const datum = payload?.find((item) => item.payload)?.payload;
  if (!active || !datum) return null;

  return (
    <div className="min-w-[190px] border border-border bg-background px-3 py-2.5 text-xs shadow-xl">
      <div className="micro-label mb-2">{datum.label}</div>
      <div className="flex items-center justify-between gap-5 text-ink">
        <span>Leads</span>
        <span className="font-mono tabular-nums">{datum.count}</span>
      </div>
      {datum.baseline !== null && (
        <div className="mt-1 flex items-center justify-between gap-5 text-stone">
          <span>Baseline avg</span>
          <span className="font-mono tabular-nums">{formatAverage(datum.baseline)}</span>
        </div>
      )}
      {datum.is_recent && (
        <div className="mt-1 flex items-center justify-between gap-5 text-stone">
          <span>Window</span>
          <span className="font-mono uppercase tracking-[0.12em]">Recent</span>
        </div>
      )}
      {datum.is_quiet && (
        <div className="mt-2 border-t border-border pt-2 text-attn">
          Quiet recent bucket: below the selected baseline.
        </div>
      )}
    </div>
  );
};

const barFillForDatum = (datum: RhythmDatum, status: LeadSeasonalityInsight["status"]) => {
  if (datum.is_quiet) return "hsl(var(--attn))";
  if (datum.is_recent && status === "building") return "hsl(var(--sage-deep))";
  if (datum.is_recent) return "hsl(var(--sage))";
  return "hsl(var(--sage))";
};

const barOpacityForDatum = (datum: RhythmDatum) => {
  if (datum.is_quiet) return 0.88;
  if (datum.is_recent) return 0.9;
  if (datum.count === 0) return 0.28;
  return 0.46;
};

export const LeadsOverTimeChart = ({ data, range, seasonality, onRangeChange }: LeadsOverTimeChartProps) => {
  const activeOption = LEAD_TIMELINE_RANGE_OPTIONS.find((option) => option.key === range) ?? LEAD_TIMELINE_RANGE_OPTIONS[1];
  const reducedMotion = usePrefersReducedMotion();
  const showBaseline = seasonality.status !== "not_enough_data" && seasonality.baseline_average > 0;
  const chartData = useMemo<RhythmDatum[]>(
    () =>
      data.map((row) => ({
        ...row,
        baseline: row.baseline ?? (showBaseline ? seasonality.baseline_average : null),
      })),
    [data, seasonality.baseline_average, showBaseline],
  );

  return (
    <section className="bg-hairline bg-top bg-no-repeat bg-[length:100%_1px] pt-8 pb-2 mt-2 px-1">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div className="max-w-md">
          <div className="micro-label mb-2">LEADS OVER TIME</div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-serif text-2xl text-ink leading-none">{activeOption.title}</h2>
            <span className={`border px-2 py-1 text-[10px] uppercase tracking-[0.16em] ${signalClasses[seasonality.status]}`}>
              {signalLabels[seasonality.status]}
            </span>
          </div>
          <p className="mt-3 text-sm text-ink leading-relaxed max-w-md">{seasonality.message}</p>
        </div>
        <div className="flex border border-border bg-background p-1 self-start sm:self-end">
          {LEAD_TIMELINE_RANGE_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => onRangeChange(option.key)}
              className={`px-2.5 py-1.5 text-[10px] uppercase tracking-[0.16em] transition-colors ${
                range === option.key
                  ? "bg-ink text-ivory"
                  : "text-stone hover:bg-secondary hover:text-ink"
              }`}
              aria-pressed={range === option.key}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 border border-border bg-background/70">
        <SignalMetric label="Recent leads" value={seasonality.recent_count} />
        <SignalMetric label="Earlier leads" value={seasonality.baseline_count} />
        <SignalMetric label="Baseline avg" value={showBaseline ? formatAverage(seasonality.baseline_average) : "n/a"} />
      </div>

      <ChartContainer
        config={{
          count: { label: "Leads", color: "hsl(var(--ink))" },
          baseline: { label: "Baseline", color: "hsl(var(--stone))" },
        }}
        className="h-[320px] w-full aspect-auto"
      >
        <ComposedChart data={chartData} margin={{ top: 14, right: 18, bottom: 4, left: -12 }}>
          <CartesianGrid vertical={false} strokeDasharray="2 8" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            minTickGap={18}
            tickMargin={10}
          />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
          <ChartTooltip
            cursor={{ fill: "hsl(var(--secondary))", opacity: 0.48 }}
            content={<SignalTooltip />}
          />
          {showBaseline && (
            <ReferenceLine
              y={seasonality.baseline_average}
              stroke="var(--color-baseline)"
              strokeDasharray="5 5"
              strokeOpacity={0.6}
            />
          )}
          <Bar
            dataKey="count"
            radius={[6, 6, 1, 1]}
            maxBarSize={18}
            minPointSize={2}
            background={{ fill: "hsl(var(--secondary))", opacity: 0.35, radius: [6, 6, 1, 1] }}
            isAnimationActive={!reducedMotion}
            animationDuration={850}
            animationEasing="ease-out"
          >
            {chartData.map((datum) => (
              <Cell
                key={datum.date}
                fill={barFillForDatum(datum, seasonality.status)}
                fillOpacity={barOpacityForDatum(datum)}
              />
            ))}
          </Bar>
        </ComposedChart>
      </ChartContainer>
    </section>
  );
};

const SignalMetric = ({ label, value }: { label: string; value: number | string }) => (
  <div className="border-r border-border px-3 py-2.5 last:border-r-0">
    <div className="text-[10px] uppercase tracking-[0.16em] text-stone">{label}</div>
    <div className="mt-1 font-serif text-xl text-ink">{value}</div>
  </div>
);
