import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Copy } from "lucide-react";
import { toast } from "sonner";

const STAGES: { key: any; label: string }[] = [
  { key: "new", label: "New" },
  { key: "qualified", label: "Qualified" },
  { key: "proposal", label: "Proposal" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
];

const Leads = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [view, setView] = useState<"board" | "table">("board");

  useEffect(() => { void load(); }, []);
  const load = async () => {
    const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    setLeads(data ?? []);
  };

  const move = async (id: string, status: any) => {
    await supabase.from("leads").update({ status }).eq("id", id);
    void load();
  };

  const intakeUrl = `${window.location.origin}/intake`;
  const copyIntake = () => {
    navigator.clipboard.writeText(intakeUrl);
    toast.success("Intake link copied");
  };

  return (
    <div className="px-12 py-12">
      <PageHeader
        eyebrow="STUDIO · LEADS"
        title="Leads."
        subtitle="Every prospect, scored and summarised the moment they arrive."
        actions={
          <>
            <button onClick={copyIntake} className="flex items-center gap-2 px-4 py-2.5 border border-border text-xs uppercase tracking-[0.18em] hover:bg-secondary transition-colors">
              <Copy size={13} /> Intake link
            </button>
            <div className="flex border border-border">
              {(["board", "table"] as const).map((v) => (
                <button key={v} onClick={() => setView(v)} className={`px-4 py-2.5 text-xs uppercase tracking-[0.18em] ${view === v ? "bg-ink text-ivory" : "text-stone hover:text-ink"}`}>{v}</button>
              ))}
            </div>
          </>
        }
      />

      {view === "board" ? (
        <div className="grid grid-cols-5 gap-px bg-border border border-border">
          {STAGES.map((s) => {
            const items = leads.filter((l) => l.status === s.key);
            return (
              <div key={s.key} className="bg-background min-h-[400px]">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <span className="micro-label">{s.label}</span>
                  <span className="text-xs text-stone">{items.length}</span>
                </div>
                <div className="p-3 space-y-2">
                  {items.map((l) => (
                    <div key={l.id} className="bg-card border border-border p-4 group">
                      <Link to={`/leads/${l.id}`} className="block">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-serif text-lg text-ink leading-tight">{l.full_name}</div>
                          {l.fit_score != null && <div className="text-xs font-medium text-ink">{l.fit_score}</div>}
                        </div>
                        <div className="text-xs text-stone mt-1.5 line-clamp-2">{l.ai_summary || l.project_type || l.brief}</div>
                        {l.budget_range && <div className="micro-label text-stone mt-3">{l.budget_range}</div>}
                      </Link>
                      <div className="hidden group-hover:flex gap-1 mt-3 pt-3 border-t border-border">
                        {STAGES.filter(x => x.key !== l.status).map(x => (
                          <button key={x.key} onClick={() => move(l.id, x.key)} className="text-[10px] uppercase tracking-wider text-stone hover:text-ink px-1.5">→{x.label}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border border-border bg-card">
          {leads.map((l) => (
            <Link key={l.id} to={`/leads/${l.id}`} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border last:border-0 hover:bg-secondary/40 items-center text-sm">
              <div className="col-span-3 font-serif text-lg text-ink">{l.full_name}</div>
              <div className="col-span-4 text-stone truncate">{l.ai_summary || l.brief}</div>
              <div className="col-span-2 text-stone text-xs">{l.budget_range || "—"}</div>
              <div className="col-span-2 micro-label">{l.status}</div>
              <div className="col-span-1 text-right text-ink">{l.fit_score ?? "—"}</div>
            </Link>
          ))}
          {leads.length === 0 && <div className="p-12 text-center text-stone text-sm">No leads yet.</div>}
        </div>
      )}
    </div>
  );
};

export default Leads;