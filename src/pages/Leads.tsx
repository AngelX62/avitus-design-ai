import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Upload, MessageSquare, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { STATUS_LABELS, temperatureClass } from "@/lib/format";

const STAGES: { key: any; label: string }[] = [
  { key: "new", label: "New" },
  { key: "needs_review", label: "Needs Review" },
  { key: "high_fit", label: "High-Fit" },
  { key: "contacted", label: "Contacted" },
  { key: "consultation_booked", label: "Consultation Booked" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
];

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
    <div className="px-6 md:px-12 py-10">
      <PageHeader
        eyebrow="STUDIO · LEAD INBOX"
        title="Lead Inbox."
        subtitle="Every inbound lead — captured, cleaned, and scored. You stay in control of every reply."
        actions={
          <>
            <Link to="/import" className="flex items-center gap-2 px-4 py-2.5 border border-border text-xs uppercase tracking-[0.18em] text-ink hover:bg-secondary transition-colors">
              <Upload size={13} /> Import Sheet
            </Link>
            <Link to="/leads/paste" className="flex items-center gap-2 px-4 py-2.5 border border-border text-xs uppercase tracking-[0.18em] text-ink hover:bg-secondary transition-colors">
              <MessageSquare size={13} /> Paste Message
            </Link>
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 bg-ink text-ivory text-xs uppercase tracking-[0.18em] hover:bg-ink/90 transition-colors">
              <Plus size={13} /> Create Lead
            </button>
            <div className="flex border border-border ml-2">
              {(["board", "table"] as const).map((v) => (
                <button key={v} onClick={() => setView(v)} className={`px-4 py-2.5 text-xs uppercase tracking-[0.18em] ${view === v ? "bg-ink text-ivory" : "text-stone hover:text-ink"}`}>{v}</button>
              ))}
            </div>
          </>
        }
      />

      {view === "board" ? (
        <div className="overflow-x-auto -mx-6 md:-mx-12 px-6 md:px-12">
          <div className="flex gap-px bg-border border border-border min-w-[1200px]">
            {STAGES.map((s) => {
              const items = leads.filter((l) => l.status === s.key);
              return (
                <div key={s.key} className="bg-background w-[260px] flex-shrink-0 min-h-[500px]">
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <span className="micro-label">{s.label}</span>
                    <span className="text-xs text-stone">{items.length}</span>
                  </div>
                  <div className="p-3 space-y-2">
                    {items.map((l) => (
                      <Link key={l.id} to={`/leads/${l.id}`} className="block bg-card border border-border p-4 hover:border-ink/40 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-serif text-lg text-ink leading-tight">{l.full_name}</div>
                          {l.fit_score != null && (
                            <div className="text-xs font-medium text-ink whitespace-nowrap">{l.fit_score}</div>
                          )}
                        </div>
                        <div className="text-xs text-stone mt-1.5">
                          {l.project_type || "—"}{l.location ? ` · ${l.location}` : ""}
                        </div>
                        {l.budget_range && <div className="text-xs text-ink mt-1.5">{l.budget_range}</div>}
                        <div className="flex items-center gap-2 mt-3">
                          {l.temperature && (
                            <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border ${temperatureClass(l.temperature)}`}>
                              {l.temperature}
                            </span>
                          )}
                        </div>
                        {l.ai_next_action && (
                          <div className="mt-3 pt-3 border-t border-border text-[11px] text-stone leading-snug line-clamp-2">
                            → {l.ai_next_action}
                          </div>
                        )}
                      </Link>
                    ))}
                    {items.length === 0 && <div className="text-xs text-stone/60 px-2 py-4">—</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="border border-border bg-card overflow-x-auto">
          <div className="min-w-[900px]">
            {leads.map((l) => (
              <Link key={l.id} to={`/leads/${l.id}`} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border last:border-0 hover:bg-secondary/40 items-center text-sm">
                <div className="col-span-3 font-serif text-lg text-ink">{l.full_name}</div>
                <div className="col-span-2 text-stone truncate">{l.project_type || "—"}</div>
                <div className="col-span-2 text-stone truncate">{l.location || "—"}</div>
                <div className="col-span-2 text-stone text-xs">{l.budget_range || "—"}</div>
                <div className="col-span-2 micro-label">{STATUS_LABELS[l.status] || l.status}</div>
                <div className="col-span-1 text-right text-ink">{l.fit_score ?? "—"}</div>
              </Link>
            ))}
            {leads.length === 0 && <div className="p-12 text-center text-stone text-sm">No leads yet.</div>}
          </div>
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
    <div className="fixed inset-0 bg-ink/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background border border-border max-w-lg w-full p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="micro-label mb-2">CREATE LEAD</div>
            <h2 className="font-serif text-3xl text-ink">New lead.</h2>
          </div>
          <button onClick={onClose} className="text-stone hover:text-ink"><X size={18} /></button>
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
            <textarea value={f.brief} onChange={(e) => setF({ ...f, brief: e.target.value })} rows={3} className="w-full bg-transparent border border-border focus:border-ink outline-none p-3 text-ink text-sm" />
          </label>
          <button disabled={busy} className="w-full px-6 py-3 bg-ink text-ivory text-xs uppercase tracking-[0.22em] hover:bg-ink/90 disabled:opacity-60">{busy ? "Creating…" : "Create lead"}</button>
        </form>
      </div>
    </div>
  );
};

const Inp = ({ label, value, onChange }: any) => (
  <label className="block">
    <div className="micro-label mb-2">{label}</div>
    <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent border-b border-border focus:border-ink outline-none py-2 text-ink" />
  </label>
);

export default Leads;
