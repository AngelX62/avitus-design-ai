import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { ArrowUpRight } from "lucide-react";

type Stats = { newLeads: number; highFit: number; activeProjects: number; designs: number };

const Index = () => {
  const [stats, setStats] = useState<Stats>({ newLeads: 0, highFit: 0, activeProjects: 0, designs: 0 });
  const [recentLeads, setRecentLeads] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const [a, b, c, d, e] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("fit_score", 75).eq("status", "new"),
        supabase.from("projects").select("id", { count: "exact", head: true }).neq("status", "delivered"),
        supabase.from("design_generations").select("id", { count: "exact", head: true }).gte("created_at", monthAgo),
        supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(5),
      ]);
      setStats({
        newLeads: a.count ?? 0,
        highFit: b.count ?? 0,
        activeProjects: c.count ?? 0,
        designs: d.count ?? 0,
      });
      setRecentLeads(e.data ?? []);
    })();
  }, []);

  return (
    <div className="px-12 py-12 max-w-6xl">
      <PageHeader eyebrow="STUDIO · OVERVIEW" title="Good day." subtitle="A calm view of what's moving through the studio right now." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border mb-16 border border-border">
        <Stat label="New leads / week" value={stats.newLeads} />
        <Stat label="High-fit waiting" value={stats.highFit} accent />
        <Stat label="Active projects" value={stats.activeProjects} />
        <Stat label="Designs / month" value={stats.designs} />
      </div>

      <div className="flex items-baseline justify-between mb-6">
        <div className="micro-label">RECENT LEADS</div>
        <Link to="/leads" className="micro-label text-stone hover:text-ink transition-colors">VIEW ALL →</Link>
      </div>

      <div className="border border-border bg-card">
        {recentLeads.length === 0 ? (
          <div className="p-12 text-center text-stone text-sm">
            No leads yet. Share your intake form from <Link to="/settings" className="text-ink underline-offset-4 hover:underline">Settings</Link>.
          </div>
        ) : recentLeads.map((l) => (
          <Link key={l.id} to={`/leads/${l.id}`} className="flex items-center gap-6 px-6 py-5 border-b border-border last:border-0 hover:bg-secondary/40 transition-colors group">
            <div className="flex-1 min-w-0">
              <div className="font-serif text-xl text-ink">{l.full_name}</div>
              <div className="text-sm text-stone truncate mt-1">{l.ai_summary || l.brief || l.project_type || "—"}</div>
            </div>
            {l.fit_score != null && (
              <div className="text-right">
                <div className="font-serif text-2xl text-ink">{l.fit_score}</div>
                <div className="micro-label text-stone">FIT</div>
              </div>
            )}
            <ArrowUpRight size={18} strokeWidth={1.25} className="text-stone group-hover:text-ink transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
};

const Stat = ({ label, value, accent }: { label: string; value: number; accent?: boolean }) => (
  <div className={`bg-background p-8 ${accent ? "bg-sand/30" : ""}`}>
    <div className="micro-label mb-4">{label}</div>
    <div className="font-serif text-5xl text-ink leading-none">{value}</div>
  </div>
);

export default Index;
