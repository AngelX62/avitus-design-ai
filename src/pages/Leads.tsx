import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { StatChip } from "@/components/StatChip";
import { Upload, MessageSquare, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { STATUS_LABELS, temperatureTone } from "@/lib/format";

const STAGES: { key: any; label: string }[] = [
  { key: "new", label: "New" },
  { key: "needs_review", label: "Needs Review" },
  { key: "high_fit", label: "High-Fit" },
  { key: "contacted", label: "Contacted" },
  { key: "consultation_booked", label: "Booked" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
];

const LETTERS = "ABCDEFGHIJKLMN";

const Leads = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [view, setView] = useState<"board" | "table">("board");
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { void load(); }, []);
  const load = async () => {
    const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    setLeads(data ?? []);
  };

  return (
    <div className="px-6 md:px-10 py-10">
      <PageHeader
        eyebrow="Inbox"
        sectionNumber={1}
        title="Lead inbox."
        subtitle="Every inbound lead — captured, cleaned, scored. You stay in control of every reply."
        actions={
          <>
            <Link to="/import" className="flex items-center gap-2 px-4 py-2.5 border border-foreground text-[11px] uppercase tracking-[0.16em] text-foreground hover:bg-panel transition-colors">
              <Upload size={12} /> Import
            </Link>
            <Link to="/leads/paste" className="flex items-center gap-2 px-4 py-2.5 border border-foreground text-[11px] uppercase tracking-[0.16em] text-foreground hover:bg-panel transition-colors">
              <MessageSquare size={12} /> Paste
            </Link>
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 bg-foreground text-background text-[11px] uppercase tracking-[0.16em] hover:opacity-90 transition-colors">
              <Plus size={12} /> Create lead
            </button>
            <div className="flex border border-foreground ml-2">
              {(["board", "table"] as const).map((v) => (
                <button key={v} onClick={() => setView(v)} className={`px-3 py-2.5 text-[11px] uppercase tracking-[0.16em] ${view === v ? "bg-foreground text-background" : "text-graphite hover:text-foreground"}`}>{v}</button>
              ))}
            </div>
          </>
        }
      />

      {view === "board" ? (
        <div className="overflow-x-auto -mx-6 md:-mx-10 px-6 md:px-10">
          <div className="flex gap-5 min-w-[1300px]">
            {STAGES.map((s, idx) => {
              const items = leads.filter((l) => l.status === s.key);
              return (
                <div key={s.key} className="w-[260px] flex-shrink-0 min-h-[500px]">
                  <div className="pb-2 border-b border-foreground flex items-baseline justify-between">
                    <div className="micro-label flex items-baseline gap-2 text-foreground">
                      <span>{LETTERS[idx]}</span>
                      <span className="text-graphite">·</span>
                      <span className="text-graphite">{s.label}</span>
                    </div>
                    <span className="serif-numeral text-[18px]">{String(items.length).padStart(2, "0")}</span>
                  </div>
                  <div className="pt-3 space-y-2">
                    {items.map((l) => (
                      <Link key={l.id} to={`/leads/${l.id}`} className="block bg-background border border-rule p-4 hover:border-foreground transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-[15px] font-medium text-foreground leading-tight">{l.full_name}</div>
                          {l.fit_score != null && (
                            <div className="serif-numeral text-[20px] whitespace-nowrap">{l.fit_score}</div>
                          )}
                        </div>
                        <div className="text-[12px] text-graphite mt-1.5">
                          {l.project_type || "—"}{l.location ? ` · ${l.location}` : ""}
                        </div>
                        {l.budget_range && <div className="text-[12px] text-foreground mt-1.5 tabular">{l.budget_range}</div>}
                        {l.temperature && (
                          <div className="mt-3">
                            <StatChip label={l.temperature} tone={temperatureTone(l.temperature)} />
                          </div>
                        )}
                        {l.ai_next_action && (
                          <div className="mt-3 pt-3 border-t border-rule text-[12px] text-graphite leading-snug line-clamp-2">
                            → {l.ai_next_action}
                          </div>
                        )}
                      </Link>
                    ))}
                    {items.length === 0 && <div className="text-[12px] text-graphite/60 py-4 italic">— empty —</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="border-t border-foreground">
          <div className="grid grid-cols-12 gap-4 py-3 border-b border-rule micro-label text-graphite px-2 -mx-2">
            <div className="col-span-3">Name</div>
            <div className="col-span-2">Project</div>
            <div className="col-span-2">Location</div>
            <div className="col-span-2">Budget</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1 text-right">Score</div>
          </div>
          {leads.map((l) => (
            <Link key={l.id} to={`/leads/${l.id}`} className="grid grid-cols-12 gap-4 py-4 border-b border-rule hover:bg-panel/60 items-baseline text-[14px] transition-colors px-2 -mx-2">
              <div className="col-span-3 text-foreground font-medium">{l.full_name}</div>
              <div className="col-span-2 text-graphite truncate">{l.project_type || "—"}</div>
              <div className="col-span-2 text-graphite truncate">{l.location || "—"}</div>
              <div className="col-span-2 text-foreground tabular text-[13px]">{l.budget_range || "—"}</div>
              <div className="col-span-2 micro-label">{STATUS_LABELS[l.status] || l.status}</div>
              <div className="col-span-1 text-right serif-numeral text-[20px]">{l.fit_score ?? "—"}</div>
            </Link>
          ))}
          {leads.length === 0 && <div className="py-20 text-center text-[16px] text-graphite">No leads yet.</div>}
        </div>
      )}

      {showCreate && <CreateLeadModal onClose={() => setShowCreate(false)} onCreated={(id) => { setShowCreate(false); navigate(`/leads/${id}`); }} />}
    </div>
  );
};

const CreateLeadModal = ({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) => {
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ full_name: "", email: "", phone: "", project_type: "", location: "", budget_range: "", brief: "" });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.full_name) { toast.error("Name required"); return; }
    setBusy(true);
    const { data, error } = await supabase.from("leads").insert({
      ...f,
      email: f.email || `unknown+${Date.now()}@manual.avitus`,
      source: "manual",
      raw_inquiry: f.brief || null,
    }).select().single();
    if (error) { toast.error(error.message); setBusy(false); return; }
    supabase.functions.invoke("score-lead", { body: { lead_id: data.id } }).catch(() => {});
    onCreated(data.id);
  };
  return (
    <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background border border-foreground max-w-lg w-full p-10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-7">
          <div>
            <div className="micro-label mb-3">N · Create lead</div>
            <h2 className="text-[34px] text-foreground leading-[1.05] tracking-[-0.03em]">New lead.</h2>
          </div>
          <button onClick={onClose} className="text-graphite hover:text-foreground"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="space-y-5">
          <Inp label="Full name *" value={f.full_name} onChange={(v: string) => setF({ ...f, full_name: v })} />
          <div className="grid grid-cols-2 gap-4">
            <Inp label="Email" value={f.email} onChange={(v: string) => setF({ ...f, email: v })} />
            <Inp label="Phone" value={f.phone} onChange={(v: string) => setF({ ...f, phone: v })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Inp label="Project type" value={f.project_type} onChange={(v: string) => setF({ ...f, project_type: v })} />
            <Inp label="Location" value={f.location} onChange={(v: string) => setF({ ...f, location: v })} />
          </div>
          <Inp label="Budget" value={f.budget_range} onChange={(v: string) => setF({ ...f, budget_range: v })} />
          <label className="block">
            <div className="micro-label mb-2">Notes</div>
            <textarea value={f.brief} onChange={(e) => setF({ ...f, brief: e.target.value })} rows={3} className="w-full bg-transparent border border-rule focus:border-foreground outline-none p-3 text-foreground text-sm" />
          </label>
          <button disabled={busy} className="w-full px-6 py-3.5 bg-foreground text-background text-[11px] uppercase tracking-[0.16em] hover:opacity-90 disabled:opacity-60">{busy ? "Creating…" : "Create lead"}</button>
        </form>
      </div>
    </div>
  );
};

const Inp = ({ label, value, onChange }: any) => (
  <label className="block">
    <div className="micro-label mb-2">{label}</div>
    <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent border-b border-rule focus:border-foreground outline-none py-2 text-foreground" />
  </label>
);

export default Leads;
