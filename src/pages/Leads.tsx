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
    <div className="px-8 md:px-16 py-10">
      <PageHeader
        eyebrow="LEAD INBOX"
        sectionNumber={2}
        title="Lead Inbox."
        subtitle={<>Every inbound lead — captured, cleaned, and scored. <em>You stay in control of every reply.</em></>}
        actions={
          <>
            <Link to="/import" className="flex items-center gap-2 px-4 py-2.5 border border-hairline text-[11px] uppercase tracking-[0.22em] text-ink hover:bg-cream transition-colors">
              <Upload size={12} /> Import Sheet
            </Link>
            <Link to="/leads/paste" className="flex items-center gap-2 px-4 py-2.5 border border-hairline text-[11px] uppercase tracking-[0.22em] text-ink hover:bg-cream transition-colors">
              <MessageSquare size={12} /> Paste Message
            </Link>
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 bg-ink text-cream text-[11px] uppercase tracking-[0.22em] hover:bg-ink/90 transition-colors">
              <Plus size={12} /> Create Lead
            </button>
            <div className="flex border border-hairline ml-2">
              {(["board", "table"] as const).map((v) => (
                <button key={v} onClick={() => setView(v)} className={`px-4 py-2.5 text-[11px] uppercase tracking-[0.22em] ${view === v ? "bg-ink text-cream" : "text-stone hover:text-ink"}`}>{v}</button>
              ))}
            </div>
          </>
        }
      />

      {view === "board" ? (
        <div className="overflow-x-auto -mx-8 md:-mx-16 px-8 md:px-16">
          <div className="flex gap-6 min-w-[1300px]">
            {STAGES.map((s, idx) => {
              const items = leads.filter((l) => l.status === s.key);
              return (
                <div key={s.key} className="w-[260px] flex-shrink-0 min-h-[500px]">
                  <div className="pb-3 border-b border-hairline flex items-baseline justify-between">
                    <div className="micro-label flex items-baseline gap-2">
                      <span className="text-ink">{String(idx + 1).padStart(2, "0")}</span>
                      <span>{s.label}</span>
                    </div>
                    <span className="serif-numeral text-[20px]">{items.length}</span>
                  </div>
                  <div className="pt-3 space-y-3">
                    {items.map((l) => (
                      <Link key={l.id} to={`/leads/${l.id}`} className="block bg-cream border border-hairline p-4 hover:border-ink/40 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-serif text-[19px] text-ink leading-tight">{l.full_name}</div>
                          {l.fit_score != null && (
                            <div className="serif-numeral text-[22px] whitespace-nowrap">{l.fit_score}</div>
                          )}
                        </div>
                        <div className="italic-serif text-[13px] mt-1.5">
                          {l.project_type || "—"}{l.location ? ` · ${l.location}` : ""}
                        </div>
                        {l.budget_range && <div className="text-xs text-ink mt-1.5">{l.budget_range}</div>}
                        {l.temperature && (
                          <div className="flex items-center gap-2 mt-3">
                            <span className={`text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 border ${temperatureClass(l.temperature)}`}>
                              {l.temperature}
                            </span>
                          </div>
                        )}
                        {l.ai_next_action && (
                          <div className="mt-3 pt-3 border-t border-hairline italic-serif text-[12px] leading-snug line-clamp-2">
                            → {l.ai_next_action}
                          </div>
                        )}
                      </Link>
                    ))}
                    {items.length === 0 && <div className="italic-serif text-[13px] text-stone/60 py-4">— empty —</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="border-t border-hairline">
          {leads.map((l) => (
            <Link key={l.id} to={`/leads/${l.id}`} className="grid grid-cols-12 gap-4 py-5 border-b border-hairline hover:bg-cream/60 items-baseline text-sm transition-colors px-2 -mx-2">
              <div className="col-span-3 font-serif text-[20px] text-ink">{l.full_name}</div>
              <div className="col-span-2 italic-serif text-[14px] truncate">{l.project_type || "—"}</div>
              <div className="col-span-2 italic-serif text-[14px] truncate">{l.location || "—"}</div>
              <div className="col-span-2 text-stone text-xs">{l.budget_range || "—"}</div>
              <div className="col-span-2 micro-label">{STATUS_LABELS[l.status] || l.status}</div>
              <div className="col-span-1 text-right serif-numeral text-[22px]">{l.fit_score ?? "—"}</div>
            </Link>
          ))}
          {leads.length === 0 && <div className="py-20 text-center italic-serif text-[18px]">No leads yet.</div>}
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
    <div className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-cream border border-hairline max-w-lg w-full p-10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-7">
          <div>
            <div className="micro-label mb-3">§ CREATE LEAD</div>
            <h2 className="font-serif text-4xl text-ink leading-none">New lead.</h2>
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
          <button disabled={busy} className="w-full px-6 py-3.5 bg-ink text-cream text-[11px] uppercase tracking-[0.22em] hover:bg-ink/90 disabled:opacity-60">{busy ? "Creating…" : "Create lead"}</button>
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
