import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { LeadSourceDatum } from "@/lib/leadStats";

const topSourceCaption = (data: LeadSourceDatum[]): string | null => {
  if (data.length === 0) return null;
  const sorted = [...data].sort((a, b) => b.count - a.count);
  const top = sorted[0];
  const second = sorted[1];
  if (!top || top.count === 0) return null;
  if (second && top.count < second.count * 2) return null;
  return `${top.label} is your strongest source right now.`;
};

export const LeadSourceChart = ({ data }: { data: LeadSourceDatum[] }) => {
  const caption = topSourceCaption(data);

  return (
    <section className="bg-hairline bg-top bg-no-repeat bg-[length:100%_1px] pt-8 pb-2 mt-2 px-1">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="max-w-md">
          <div className="micro-label mb-2">SOURCE BREAKDOWN</div>
          <h2 className="font-serif text-2xl text-ink leading-none">Where leads enter.</h2>
          {caption && (
            <p className="mt-3 text-sm text-ink leading-relaxed">{caption}</p>
          )}
        </div>
        <div className="text-xs text-stone leading-relaxed max-w-[180px] text-right">
          Intake, paste, import, manual, and other.
        </div>
      </div>
      <ChartContainer config={{ count: { label: "Leads", color: "hsl(var(--sage))" } }} className="h-[280px] w-full aspect-auto">
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -12 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} interval={0} stroke="hsl(var(--stone))" />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} stroke="hsl(var(--stone))" />
          <ChartTooltip cursor={{ fill: "hsl(var(--sage-soft))", opacity: 0.6 }} content={<ChartTooltipContent hideLabel />} />
          <Bar dataKey="count" fill="var(--color-count)" radius={[3, 3, 0, 0]} barSize={34} />
        </BarChart>
      </ChartContainer>
    </section>
  );
};
