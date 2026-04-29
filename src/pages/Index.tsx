import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { SectionMarker } from "@/components/SectionMarker";
import { KPI } from "@/components/KPI";
import { Hairline } from "@/components/Hairline";
import { ArrowUpRight, FileText, MessageSquare, Upload, Bell } from "lucide-react";
import { SOURCE_LABELS, STATUS_LABELS, formatRelative } from "@/lib/format";

const Index = () => {
  const [stats, setStats] = useState({ hot: 0, newWeek: 0, needsReview: 0, followups: 0, dupes: 0 });
  const [activity, setActivity] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
      const nowIso = new Date().toISOString();

      const [hot, nw, nr, follow, leads] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("temperature", "hot").in("status", ["new", "needs_review", "high_fit"]),
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "needs_review"),
        supabase.from("leads").select("id, reminder_at, last_contacted_at, status").or(`reminder_at.lte.${nowIso},and(status.eq.contacted,last_contacted_at.lte.${threeDaysAgo})`),
        supabase.from("leads").select("id, email, phone").not("email", "is", null),
      ]);

      // Possible duplicates: pairs sharing email or phone
      const counts: Record<string, number> = {};
      (leads.data ?? []).forEach((l: any) => {
        if (l.email) counts[`e:${l.email.toLowerCase()}`] = (counts[`e:${l.email.toLowerCase()}`] || 0) + 1;
        if (l.phone) counts[`p:${l.phone}`] = (counts[`p:${l.phone}`] || 0) + 1;
      });
      const dupes = Object.values(counts).filter((n) => n > 1).length;

      setStats({
        hot: hot.count ?? 0,
        newWeek: nw.count ?? 0,
        needsReview: nr.count ?? 0,
        followups: (follow.data ?? []).length,
        dupes,
      });

      // Recent activity: leads + status history
      const [{ data: recentLeads }, { data: recentHist }] = await Promise.all([
        supabase.from("leads").select("id, full_name, source, created_at").order("created_at", { ascending: false }).limit(15),
        supabase.from("lead_status_history").select("lead_id, to_status, changed_at, leads(full_name)").order("changed_at", { ascending: false }).limit(10),
      ]);

      const merged = [
        ...(recentLeads ?? []).map((l: any) => ({
          kind: "lead", id: l.id, name: l.full_name, source: l.source, at: l.created_at,
        })),
        ...(recentHist ?? []).map((h: any) => ({
          kind: "status", id: h.lead_id, name: h.leads?.full_name || "Lead", to: h.to_status, at: h.changed_at,
        })),
      ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 15);

      setActivity(merged);
    })();
  }, []);

  const issueDate = new Date().toLocaleDateString(undefined, { month: "short", year: "numeric" }).toUpperCase();

  return (
    <div className="px-8 md:px-16 py-10 max-w-6xl">
      {/* Masthead */}
      <div className="flex items-baseline justify-between pb-4 border-b border-hairline mb-10">
        <div className="micro-label tracking-[0.32em]">
          AVITUS · STUDIO OPERATING SYSTEM
        </div>
        <div className="micro-label tracking-[0.28em]">{issueDate}</div>
      </div>

      <PageHeader
        eyebrow="OVERVIEW"
        sectionNumber={1}
        title="Lead Inbox at a glance."
        subtitle={<>Hot leads, follow-ups due, and what landed today — <em>without the noise.</em></>}
      />

      {/* Hero KPI */}
      <div className="grid md:grid-cols-12 gap-10 items-end pb-12">
        <div className="md:col-span-7">
          <KPI
            label="Hot leads waiting"
            value={stats.hot}
            size="hero"
            accent={stats.hot > 0}
            caption={
              stats.hot > 0
                ? <>Inbound prospects flagged as <em>high-fit</em> and ready for a reply.</>
                : <>No urgent leads. The inbox is calm.</>
            }
          />
        </div>
        <div className="md:col-span-5 italic-serif text-[15px] leading-relaxed pb-4 border-l border-hairline pl-6">
          A daily read of the studio's pipeline — composed, not crowded. Begin with what matters most, then move down the page.
        </div>
      </div>

      {/* Sibling KPIs — hairline divided, no boxes */}
      <Hairline />
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-hairline">
        <SiblingKPI label="New this week" value={stats.newWeek} />
        <SiblingKPI label="Needs review" value={stats.needsReview} />
        <SiblingKPI label="Follow-ups due" value={stats.followups} />
        <SiblingKPI label="Possible duplicates" value={stats.dupes} />
      </div>
      <Hairline />

      {/* Recent activity */}
      <div className="mt-16">
        <SectionMarker
          number={2}
          label="RECENT ACTIVITY"
          trailing={
            <Link to="/leads" className="micro-label text-stone hover:text-ink">
              VIEW INBOX →
            </Link>
          }
        />

        {activity.length === 0 ? (
          <div className="py-20 text-center">
            <p className="italic-serif text-[20px] leading-relaxed max-w-md mx-auto">
              Nothing yet. Share your{" "}
              <a href="/intake" target="_blank" rel="noreferrer" className="text-ink underline underline-offset-4 decoration-hairline hover:decoration-ink">
                intake form
              </a>
              , paste a message, or import a sheet.
            </p>
          </div>
        ) : (
          <div className="mt-6">
            {activity.map((a, i) => (
              <Link
                key={i}
                to={`/leads/${a.id}`}
                className="flex items-center gap-5 py-5 border-t border-hairline last:border-b group hover:bg-cream/60 px-2 -mx-2 transition-colors"
              >
                <div className="w-7 h-7 flex items-center justify-center text-stone shrink-0">
                  {a.kind === "status" ? <Bell size={13} /> : iconForSource(a.source)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-serif text-[20px] text-ink leading-tight truncate">{a.name}</div>
                  <div className="italic-serif text-[14px] mt-0.5">
                    {a.kind === "status"
                      ? <>Moved to {STATUS_LABELS[a.to] || a.to}</>
                      : <>{SOURCE_LABELS[a.source] || a.source} · new lead</>}
                  </div>
                </div>
                <div className="micro-label text-stone shrink-0">{formatRelative(a.at)}</div>
                <ArrowUpRight size={16} strokeWidth={1.25} className="text-stone group-hover:text-ink shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const iconForSource = (s?: string) => {
  if (s === "intake_form") return <FileText size={13} />;
  if (s === "pasted") return <MessageSquare size={13} />;
  if (s === "imported") return <Upload size={13} />;
  return <FileText size={13} />;
};

const SiblingKPI = ({ label, value }: { label: string; value: number }) => (
  <div className="px-6 py-7 first:pl-0 last:pr-0">
    <div className="micro-label mb-3">{label}</div>
    <div className="serif-numeral text-[44px]">{value}</div>
  </div>
);

export default Index;
