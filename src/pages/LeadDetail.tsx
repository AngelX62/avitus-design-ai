import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Copy, ArrowLeft, Edit3, CheckCircle2, Clock, MessageSquareQuote } from "lucide-react";
import { STATUS_LABELS, SOURCE_LABELS, temperatureClass, formatRelative } from "@/lib/format";

const STATUSES = ["new", "needs_review", "high_fit", "contacted", "consultation_booked", "won", "lost"];

const LeadDetail = () => {
  const { id } = useParams();
  const [lead, setLead] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [note, setNote] = useState("");
  const [scoring, setScoring] = useState(false);
  const [editingFollowup, setEditingFollowup] = useState(false);
  const [followupDraft, setFollowupDraft] = useState("");

  useEffect(() => { if (id) void load(); }, [id]);
  const load = async () => {
    const [{ data }, { data: act }, { data: hist }] = await Promise.all([
      supabase.from("leads").select("*").eq("id", id).maybeSingle(),
      supabase.from("lead_activities").select("*").eq("lead_id", id).order("created_at", { ascending: false }),
      supabase.from("lead_status_history").select("*").eq("lead_id", id).order("changed_at", { ascending: false }),
    ]);
    setLead(data);
    setFollowupDraft(data?.suggested_followup || "");
    setActivities(act ?? []);
    setHistory(hist ?? []);
  };

  const runAi = async () => {
    setScoring(true);
    const { error } = await supabase.functions.invoke("score-lead", { body: { lead_id: id } });
    setScoring(false);
    if (error) toast.error(error.message); else { toast.success("Re-analysed"); void load(); }
  };

  const updateStatus = async (status: string) => {
    await supabase.from("leads").update({ status: status as any }).eq("id", id);
    void load();
  };

  const markContacted = async () => {
    await supabase.from("leads").update({ status: "contacted" as any, last_contacted_at: new Date().toISOString() }).eq("id", id);
    toast.success("Marked as contacted");
    void load();
  };

  const setReminder = async (days: number) => {
    const at = new Date(Date.now() + days * 86400000).toISOString();
    await supabase.from("leads").update({ reminder_at: at }).eq("id", id);
    toast.success(`Reminder set for ${days} day${days > 1 ? "s" : ""}`);
    void load();
  };

  const saveFollowup = async () => {
    await supabase.from("leads").update({ suggested_followup: followupDraft }).eq("id", id);
    setEditingFollowup(false);
    toast.success("Follow-up updated");
    void load();
  };

  const addNote = async () => {
    if (!note.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("lead_activities").insert({ lead_id: id, kind: "note", body: note, author_id: user?.id });
    setNote("");
    void load();
  };

  if (!lead) return <div className="p-12 micro-label">Loading…</div>;

  const sb = lead.score_breakdown || {};
  const breakdown = [
    { key: "budget_fit", label: "Budget fit" },
    { key: "timeline_fit", label: "Timeline fit" },
    { key: "location_fit", label: "Location fit" },
    { key: "project_type_fit", label: "Project type fit" },
    { key: "decision_maker", label: "Decision-maker readiness" },
    { key: "clarity", label: "Clarity / completeness" },
  ];

  const customEntries = Object.entries(lead.custom_fields || {});

  return (
    <div className="px-6 md:px-12 py-10 max-w-5xl">
      <Link to="/leads" className="inline-flex items-center gap-2 micro-label text-stone hover:text-ink mb-6"><ArrowLeft size={12} /> LEAD INBOX</Link>

      {/* A. Lead Overview */}
      <section className="border border-border bg-card p-8 mb-8">
        <div className="flex flex-wrap items-start justify-between gap-6 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="micro-label">{SOURCE_LABELS[lead.source] || lead.source}</span>
              {lead.temperature && (
                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border ${temperatureClass(lead.temperature)}`}>{lead.temperature}</span>
              )}
            </div>
            <h1 className="font-serif text-4xl text-ink leading-tight">{lead.full_name}</h1>
            <div className="text-stone text-sm mt-2">{lead.email}{lead.phone ? ` · ${lead.phone}` : ""}</div>
          </div>
          <div className="flex items-baseline gap-3">
            {lead.fit_score != null ? (
              <>
                <div className="font-serif text-6xl text-ink leading-none">{lead.fit_score}</div>
                <div className="micro-label text-stone">FIT</div>
              </>
            ) : (
              <button onClick={runAi} disabled={scoring} className="flex items-center gap-2 px-4 py-2.5 border border-border text-xs uppercase tracking-[0.18em] hover:bg-secondary disabled:opacity-50">
                <Sparkles size={13} /> {scoring ? "Analysing…" : "Analyse with AI"}
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-border">
          <div>
            <div className="micro-label mb-1.5">STATUS</div>
            <select value={lead.status} onChange={(e) => updateStatus(e.target.value)}
              className="bg-transparent border border-border focus:border-ink outline-none px-3 py-2 text-sm text-ink">
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>)}
            </select>
          </div>
          {lead.ai_next_action && (
            <div className="flex-1 min-w-[200px]">
              <div className="micro-label mb-1.5">RECOMMENDED NEXT ACTION</div>
              <div className="text-sm text-ink">{lead.ai_next_action}</div>
            </div>
          )}
          {lead.fit_score != null && (
            <button onClick={runAi} disabled={scoring} className="text-xs text-stone hover:text-ink uppercase tracking-[0.18em]">
              {scoring ? "Re-analysing…" : "Re-analyse"}
            </button>
          )}
        </div>
      </section>

      {/* B. Raw Inquiry */}
      <Section title="Raw Inquiry" icon={<MessageSquareQuote size={12} />}>
        <pre className="bg-secondary/40 border border-border p-5 text-sm text-ink whitespace-pre-wrap font-sans leading-relaxed">
          {lead.raw_inquiry || lead.brief || <span className="text-stone">No original message captured.</span>}
        </pre>
      </Section>

      {/* C. AI Summary */}
      {lead.ai_summary && (
        <Section title="AI Summary">
          <p className="text-ink text-[15px] leading-relaxed">{lead.ai_summary}</p>
        </Section>
      )}

      {/* D. Extracted Fields */}
      <Section title="Extracted Fields">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border">
          {[
            ["Project type", lead.project_type],
            ["Property type", lead.property_type],
            ["Location", lead.location],
            ["Budget", lead.budget_range],
            ["Timeline", lead.timeline],
            ["Style", lead.style_preference],
            ["Urgency", lead.urgency],
            ["Source", SOURCE_LABELS[lead.source] || lead.source],
          ].map(([label, value]) => (
            <div key={label as string} className="bg-background p-4">
              <div className="micro-label mb-1.5">{label}</div>
              <div className="text-sm text-ink">{value || <span className="text-stone">—</span>}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* E. Score Breakdown */}
      {Object.keys(sb).length > 0 && (
        <Section title="Score Breakdown">
          <div className="space-y-3">
            {breakdown.map(({ key, label }) => {
              const v = sb[key];
              return (
                <div key={key}>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <div className="text-sm text-ink">{label}</div>
                    <div className="text-xs text-stone">{v ?? "—"}</div>
                  </div>
                  <div className="h-1 bg-secondary">
                    <div className="h-full bg-ink" style={{ width: `${v || 0}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* F. Missing Information */}
      {lead.missing_info?.length > 0 && (
        <Section title="Missing Information">
          <ul className="space-y-2 text-sm text-ink">
            {lead.missing_info.map((q: string, i: number) => <li key={i} className="flex gap-2">· <span>{q}</span></li>)}
          </ul>
        </Section>
      )}

      {/* G. Prepared Follow-Up */}
      <Section title="Prepared Follow-Up">
        {editingFollowup ? (
          <textarea value={followupDraft} onChange={(e) => setFollowupDraft(e.target.value)} rows={8}
            className="w-full bg-transparent border border-border focus:border-ink outline-none p-4 text-ink text-[15px] leading-relaxed mb-3" />
        ) : (
          <pre className="bg-card border border-border p-5 text-sm text-ink whitespace-pre-wrap font-sans leading-relaxed mb-4">
            {lead.suggested_followup || lead.ai_reply_draft || <span className="text-stone">No follow-up drafted yet. Run AI analysis first.</span>}
          </pre>
        )}
        <div className="flex flex-wrap gap-2">
          {editingFollowup ? (
            <>
              <button onClick={saveFollowup} className="px-4 py-2 bg-ink text-ivory text-xs uppercase tracking-[0.18em]">Save message</button>
              <button onClick={() => { setEditingFollowup(false); setFollowupDraft(lead.suggested_followup || ""); }} className="px-4 py-2 border border-border text-xs uppercase tracking-[0.18em] text-stone">Cancel</button>
            </>
          ) : (
            <>
              <button onClick={() => { navigator.clipboard.writeText(lead.suggested_followup || lead.ai_reply_draft || ""); toast.success("Copied"); }}
                className="flex items-center gap-2 px-4 py-2 border border-border text-xs uppercase tracking-[0.18em] hover:bg-secondary"><Copy size={12} /> Copy Message</button>
              <button onClick={() => setEditingFollowup(true)}
                className="flex items-center gap-2 px-4 py-2 border border-border text-xs uppercase tracking-[0.18em] hover:bg-secondary"><Edit3 size={12} /> Edit Message</button>
              <button onClick={markContacted}
                className="flex items-center gap-2 px-4 py-2 border border-border text-xs uppercase tracking-[0.18em] hover:bg-secondary"><CheckCircle2 size={12} /> Mark as Contacted</button>
              <ReminderMenu onPick={setReminder} />
            </>
          )}
        </div>
        {lead.last_contacted_at && (
          <div className="text-xs text-stone mt-3">Last contacted {formatRelative(lead.last_contacted_at)}</div>
        )}
        {lead.reminder_at && (
          <div className="text-xs text-stone mt-1">Reminder set for {new Date(lead.reminder_at).toLocaleString()}</div>
        )}
      </Section>

      {/* H. Custom Fields */}
      {customEntries.length > 0 && (
        <Section title="Custom Fields">
          <div className="border border-border bg-card divide-y divide-border">
            {customEntries.map(([k, v]) => (
              <div key={k} className="grid grid-cols-3 gap-4 px-5 py-3">
                <div className="micro-label col-span-1">{k}</div>
                <div className="col-span-2 text-sm text-ink">{String(v)}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* I. Notes & History */}
      <Section title="Notes & History">
        <div className="flex gap-2 mb-5">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add an internal note…"
            className="flex-1 bg-transparent border-b border-border focus:border-ink outline-none py-2 text-sm" />
          <button onClick={addNote} className="px-4 text-xs uppercase tracking-[0.18em] text-stone hover:text-ink">Add</button>
        </div>
        <div className="space-y-3">
          {[...activities.map((a) => ({ ...a, _kind: "note", _at: a.created_at })),
            ...history.map((h) => ({ ...h, _kind: "status", _at: h.changed_at }))]
            .sort((a, b) => new Date(b._at).getTime() - new Date(a._at).getTime())
            .map((row, i) => (
              <div key={i} className="border-l border-border pl-4 py-1">
                {row._kind === "note" ? (
                  <div className="text-sm text-ink">{row.body}</div>
                ) : (
                  <div className="text-sm text-ink">
                    Status: <span className="text-stone">{STATUS_LABELS[row.from_status] || row.from_status || "—"}</span> → <span className="text-ink">{STATUS_LABELS[row.to_status] || row.to_status}</span>
                  </div>
                )}
                <div className="text-xs text-stone mt-1">{new Date(row._at).toLocaleString()}</div>
              </div>
            ))}
          {activities.length === 0 && history.length === 0 && (
            <div className="text-sm text-stone">No activity yet.</div>
          )}
        </div>
      </Section>
    </div>
  );
};

const Section = ({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) => (
  <section className="mb-10">
    <div className="micro-label mb-4 flex items-center gap-2">{icon}{title}</div>
    {children}
  </section>
);

const ReminderMenu = ({ onPick }: { onPick: (d: number) => void }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 px-4 py-2 border border-border text-xs uppercase tracking-[0.18em] hover:bg-secondary">
        <Clock size={12} /> Create Reminder
      </button>
      {open && (
        <div className="absolute top-full mt-2 left-0 bg-background border border-border z-10 min-w-[160px]">
          {[{ d: 1, l: "In 1 day" }, { d: 3, l: "In 3 days" }, { d: 7, l: "In 1 week" }, { d: 14, l: "In 2 weeks" }].map(({ d, l }) => (
            <button key={d} onClick={() => { onPick(d); setOpen(false); }}
              className="block w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-secondary">{l}</button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeadDetail;
