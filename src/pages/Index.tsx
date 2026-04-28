import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { ArrowUpRight, FileText, MessageSquare, Upload, Activity, Bell } from "lucide-react";
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

  return (
    <div className="px-6 md:px-12 py-10 max-w-6xl">
      <PageHeader eyebrow="STUDIO · OVERVIEW" title="Lead Inbox at a glance." subtitle="Hot leads, follow-ups due, and what landed today — without the noise." />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-border mb-12 border border-border">
        <Stat label="Hot leads waiting" value={stats.hot} accent />
        <Stat label="New this week" value={stats.newWeek} />
        <Stat label="Needs review" value={stats.needsReview} />
        <Stat label="Follow-ups due" value={stats.followups} />
        <Stat label="Possible duplicates" value={stats.dupes} />
      </div>

      <div className="flex items-baseline justify-between mb-6">
        <div className="micro-label flex items-center gap-2"><Activity size={11} /> RECENT ACTIVITY</div>
        <Link to="/leads" className="micro-label text-stone hover:text-ink">VIEW INBOX →</Link>
      </div>

      <div className="border border-border bg-card">
        {activity.length === 0 ? (
          <div className="p-12 text-center text-stone text-sm">
            Nothing yet. Share your <a href="/intake" target="_blank" rel="noreferrer" className="text-ink underline-offset-4 hover:underline">intake form</a>, paste a message, or import a sheet.
          </div>
        ) : activity.map((a, i) => (
          <Link key={i} to={`/leads/${a.id}`} className="flex items-center gap-4 px-5 md:px-6 py-4 border-b border-border last:border-0 hover:bg-secondary/40 group">
            <div className="w-7 h-7 flex items-center justify-center bg-secondary text-stone shrink-0">
              {a.kind === "status" ? <Bell size={12} /> : iconForSource(a.source)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-ink truncate">{a.name}</div>
              <div className="text-xs text-stone mt-0.5">
                {a.kind === "status"
                  ? `Moved to ${STATUS_LABELS[a.to] || a.to}`
                  : `${SOURCE_LABELS[a.source] || a.source} · new lead`}
              </div>
            </div>
            <div className="text-xs text-stone shrink-0">{formatRelative(a.at)}</div>
            <ArrowUpRight size={15} strokeWidth={1.25} className="text-stone group-hover:text-ink shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
};

const iconForSource = (s?: string) => {
  if (s === "intake_form") return <FileText size={12} />;
  if (s === "pasted") return <MessageSquare size={12} />;
  if (s === "imported") return <Upload size={12} />;
  return <FileText size={12} />;
};

const Stat = ({ label, value, accent }: { label: string; value: number; accent?: boolean }) => (
  <div className={`bg-background p-6 ${accent ? "bg-sand/30" : ""}`}>
    <div className="micro-label mb-3">{label}</div>
    <div className="font-serif text-4xl text-ink leading-none">{value}</div>
  </div>
);

export default Index;
