import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUpRight } from "lucide-react";
import { SectionMarker } from "@/components/SectionMarker";
import { PipelineBar } from "@/components/PipelineBar";
import { StatChip } from "@/components/StatChip";
import { SOURCE_LABELS, STATUS_LABELS, formatRelative, temperatureTone } from "@/lib/format";

const Index = () => {
  const [stats, setStats] = useState({ hot: 0, newWeek: 0, needsReview: 0, followups: 0, dupes: 0 });
  const [pipeline, setPipeline] = useState<Record<string, number>>({});
  const [activity, setActivity] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
      const nowIso = new Date().toISOString();

      const [hot, nw, nr, follow, leads, all] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("temperature", "hot").in("status", ["new", "needs_review", "high_fit"]),
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "needs_review"),
        supabase.from("leads").select("id, reminder_at, last_contacted_at, status").or(`reminder_at.lte.${nowIso},and(status.eq.contacted,last_contacted_at.lte.${threeDaysAgo})`),
        supabase.from("leads").select("id, email, phone").not("email", "is", null),
        supabase.from("leads").select("status"),
      ]);

      const counts: Record<string, number> = {};
      (leads.data ?? []).forEach((l: any) => {
        if (l.email) counts[`e:${l.email.toLowerCase()}`] = (counts[`e:${l.email.toLowerCase()}`] || 0) + 1;
        if (l.phone) counts[`p:${l.phone}`] = (counts[`p:${l.phone}`] || 0) + 1;
      });
      const dupes = Object.values(counts).filter((n) => n > 1).length;

      const pipe: Record<string, number> = {};
      (all.data ?? []).forEach((l: any) => { pipe[l.status] = (pipe[l.status] || 0) + 1; });
      setPipeline(pipe);

      setStats({
        hot: hot.count ?? 0,
        newWeek: nw.count ?? 0,
        needsReview: nr.count ?? 0,
        followups: (follow.data ?? []).length,
        dupes,
      });

      const [{ data: recentLeads }, { data: recentHist }] = await Promise.all([
        supabase.from("leads").select("id, full_name, source, created_at, temperature, project_type, location").order("created_at", { ascending: false }).limit(15),
        supabase.from("lead_status_history").select("lead_id, to_status, changed_at, leads(full_name)").order("changed_at", { ascending: false }).limit(10),
      ]);

      const merged = [
        ...(recentLeads ?? []).map((l: any) => ({
          kind: "lead", id: l.id, name: l.full_name, source: l.source, at: l.created_at,
          temperature: l.temperature, project_type: l.project_type, location: l.location,
        })),
        ...(recentHist ?? []).map((h: any) => ({
          kind: "status", id: h.lead_id, name: h.leads?.full_name || "Lead", to: h.to_status, at: h.changed_at,
        })),
      ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 12);

      setActivity(merged);
    })();
  }, []);

  const totalPipeline = Math.max(1, Object.values(pipeline).reduce((a, b) => a + b, 0));
  const stages: { key: string; label: string; accent?: boolean }[] = [
    { key: "new", label: "New" },
    { key: "needs_review", label: "Needs review" },
    { key: "high_fit", label: "High-fit" },
    { key: "contacted", label: "Contacted" },
    { key: "consultation_booked", label: "Booked" },
    { key: "won", label: "Won", accent: true },
  ];

  return (
    <div className="px-6 md:px-10 py-10">
      {/* A · TODAY'S BRIEF + B · PIPELINE — asymmetric 7/5 split */}
      <div className="grid md:grid-cols-12 border-y border-foreground">
        <section className="md:col-span-7 px-0 md:pr-12 py-12 md:border-r border-rule">
          <div className="micro-label mb-5">A · Today's brief</div>
          <h1 className="text-[40px] md:text-[56px] leading-[1.02] tracking-[-0.035em] font-normal text-foreground">
            {stats.hot > 0 ? (
              <>{stats.hot === 1 ? "One prospect" : `${stats.hot} prospects`} worth a reply<br/><span className="text-graphite">before lunch.</span></>
            ) : (
              <>The inbox is calm.<br/><span className="text-graphite">Nothing urgent today.</span></>
            )}
          </h1>

          <div className="grid grid-cols-3 mt-12 border-t border-foreground">
            <Cell label="Hot" value={stats.hot} accent={stats.hot > 0} delta={stats.hot > 0 ? `${stats.hot} awaiting reply` : "— clear"} />
            <Cell label="New · 7d" value={stats.newWeek} delta="this week" border />
            <Cell label="Review" value={stats.needsReview} delta={stats.needsReview ? "needs your eye" : "— flat"} border />
          </div>
        </section>

        <aside className="md:col-span-5 bg-panel px-6 md:px-10 py-12">
          <div className="micro-label mb-6">B · Pipeline</div>
          <div className="space-y-4">
            {stages.map((s) => (
              <PipelineBar
                key={s.key}
                label={s.label}
                value={pipeline[s.key] ?? 0}
                pct={((pipeline[s.key] ?? 0) / totalPipeline) * 100}
                accent={s.accent}
              />
            ))}
          </div>
          <div className="mt-8 pt-6 border-t border-rule flex justify-between items-baseline">
            <div className="micro-label">Follow-ups due</div>
            <div className="serif-numeral text-[28px]">{stats.followups}</div>
          </div>
          <div className="flex justify-between items-baseline mt-3">
            <div className="micro-label">Possible duplicates</div>
            <div className="serif-numeral text-[28px]">{stats.dupes}</div>
          </div>
        </aside>
      </div>

      {/* C · Recent inquiries */}
      <section className="mt-14">
        <SectionMarker
          number={3}
          label="Recent inquiries"
          trailing={
            <Link to="/leads" className="text-[11px] uppercase tracking-[0.16em] text-graphite hover:text-foreground">
              view all →
            </Link>
          }
        />

        {activity.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-[16px] text-graphite leading-relaxed max-w-md mx-auto">
              Nothing yet. Share your{" "}
              <a href="/intake" target="_blank" rel="noreferrer" className="text-foreground underline underline-offset-4 decoration-rule hover:decoration-foreground">
                intake form
              </a>
              , paste a message, or import a sheet.
            </p>
          </div>
        ) : (
          <div className="mt-2">
            {activity.map((a, i) => (
              <Link
                key={i}
                to={`/leads/${a.id}`}
                className="grid grid-cols-12 gap-4 items-baseline py-4 border-b border-rule group hover:bg-panel/60 px-2 -mx-2 transition-colors"
              >
                <div className="col-span-1 micro-label tabular text-graphite">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="col-span-5 md:col-span-4">
                  <div className="text-[16px] text-foreground leading-tight truncate">{a.name}</div>
                  <div className="text-[12px] text-graphite mt-1">
                    {a.kind === "status"
                      ? <>Moved to {STATUS_LABELS[a.to] || a.to}</>
                      : <>{[a.project_type, a.location].filter(Boolean).join(" · ") || SOURCE_LABELS[a.source] || a.source}</>}
                  </div>
                </div>
                <div className="hidden md:block col-span-3 text-[12px] text-graphite">
                  {a.kind === "lead" ? SOURCE_LABELS[a.source] || a.source : "Status change"}
                </div>
                <div className="col-span-3 md:col-span-2">
                  {a.kind === "lead" && a.temperature && (
                    <StatChip label={a.temperature} tone={temperatureTone(a.temperature)} />
                  )}
                </div>
                <div className="col-span-3 md:col-span-1 text-right text-[11px] tabular tracking-[0.1em] text-graphite">
                  {formatRelative(a.at)}
                </div>
                <div className="hidden md:flex col-span-1 justify-end">
                  <ArrowUpRight size={14} strokeWidth={1.25} className="text-graphite group-hover:text-foreground" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

const Cell = ({ label, value, delta, accent, border }: { label: string; value: number; delta?: string; accent?: boolean; border?: boolean }) => (
  <div className={`px-5 py-6 first:pl-0 ${border ? "border-l border-rule" : ""}`}>
    <div className="micro-label mb-3">{label}</div>
    <div className={`serif-numeral text-[56px] md:text-[64px] ${accent ? "text-accent" : ""}`}>
      {String(value).padStart(2, "0")}
    </div>
    {delta && <div className={`text-[12px] mt-2 ${accent ? "text-accent" : "text-graphite"}`}>{delta}</div>}
  </div>
);

export default Index;
