import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Copy, ArrowLeft, Edit3, CheckCircle2, Clock } from "lucide-react";
import { STATUS_LABELS, SOURCE_LABELS, temperatureClass, formatRelative } from "@/lib/format";
import { SectionMarker } from "@/components/SectionMarker";

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
    <div className="px-8 md:px-16 py-10 max-w-5xl">
      <Link to="/leads" className="inline-flex items-center gap-2 micro-label text-stone hover:text-ink mb-8"><ArrowLeft size={12} /> LEAD INBOX</Link>

      {/* A. Lead Overview — borderless, hairline-led */}
      <section className="pb-10 mb-12 border-b border-hairline">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-3">
              <span className="micro-label">{SOURCE_LABELS[lead.source] || lead.source}</span>
              {lead.temperature && (
                <span className={`text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 border ${temperatureClass(lead.temperature)}`}>{lead.temperature}</span>
              )}
            </div>
            <h1 className="font-serif text-5xl md:text-6xl text-ink leading-[0.95]">{lead.full_name}</h1>
            <div className="italic-serif text-[16px] mt-4">{lead.email}{lead.phone ? ` · ${lead.phone}` : ""}</div>
          </div>
          <div className="flex items-baseline gap-3">
            {lead.fit_score != null ? (
              <>
                <div className="serif-numeral text-[88px] md:text-[112px]">{lead.fit_score}</div>
                <div className="micro-label text-stone">FIT</div>
              </>
            ) : (
              <button onClick={runAi} disabled={scoring} className="flex items-center gap-2 px-4 py-2.5 border border-hairline text-[11px] uppercase tracking-[0.22em] hover:bg-cream disabled:opacity-50">
                <Sparkles size={12} /> {scoring ? "Analysing…" : "Analyse with AI"}
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-6 pt-8 mt-8 border-t border-hairline">
          <div>
            <div className="micro-label mb-2">STATUS</div>
            <select value={lead.status} onChange={(e) => updateStatus(e.target.value)}
              className="bg-transparent border border-hairline focus:border-ink outline-none px-3 py-2 text-sm text-ink">
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>)}
            </select>
          </div>
          {lead.ai_next_action && (
            <div className="flex-1 min-w-[200px]">
              <div className="micro-label mb-2">RECOMMENDED NEXT ACTION</div>
              <div className="italic-serif text-[18px] leading-snug text-ink">{lead.ai_next_action}</div>
            </div>
          )}
          {lead.fit_score != null && (
            <button onClick={runAi} disabled={scoring} className="text-[11px] text-stone hover:text-ink uppercase tracking-[0.22em]">
              {scoring ? "Re-analysing…" : "Re-analyse"}
            </button>
          )}
        </div>
      </section>

      {/* B. Raw Inquiry */}
      <Section number={1} title="RAW INQUIRY">
        <pre className="bg-cream border-l-2 border-hairline pl-6 pr-5 py-5 text-[15px] text-ink whitespace-pre-wrap font-sans leading-relaxed">
          {lead.raw_inquiry || lead.brief || <span className="italic-serif">No original message captured.</span>}
        </pre>
      </Section>

      {/* C. AI Summary */}
      {lead.ai_summary && (
        <Section number={2} title="AI SUMMARY">
          <p className="font-serif text-[24px] text-ink leading-snug max-w-3xl">{lead.ai_summary}</p>
        </Section>
      )}

      {/* D. Extracted Fields */}
      <Section number={3} title="EXTRACTED FIELDS">
        <div className="grid grid-cols-2 md:grid-cols-4 border-t border-hairline">
          {[
            ["Project type", lead.project_type],
            ["Property type", lead.property_type],
            ["Location", lead.location],
            ["Budget", lead.budget_range],
            ["Timeline", lead.timeline],
            ["Style", lead.style_preference],
            ["Urgency", lead.urgency],
            ["Source", SOURCE_LABELS[lead.source] || lead.source],
          ].map(([label, value], i) => (
            <div key={label as string} className={`py-5 px-5 border-b border-hairline ${i % 4 !== 0 ? "md:border-l border-hairline" : ""}`}>
              <div className="micro-label mb-2">{label}</div>
              <div className="font-serif text-[20px] text-ink leading-tight">{value || <span className="italic-serif text-[16px]">—</span>}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* E. Score Breakdown */}
      {Object.keys(sb).length > 0 && (
        <Section number={4} title="SCORE BREAKDOWN">
          <div className="space-y-4">
            {breakdown.map(({ key, label }) => {
              const v = sb[key];
              return (
                <div key={key}>
                  <div className="flex items-baseline justify-between mb-2">
                    <div className="font-serif text-[18px] text-ink">{label}</div>
                    <div className="serif-numeral text-[20px]">{v ?? "—"}</div>
                  </div>
                  <div className="h-px bg-sand">
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
        <Section number={5} title="MISSING INFORMATION">
          <ul className="space-y-3 max-w-2xl">
            {lead.missing_info.map((q: string, i: number) => (
              <li key={i} className="flex gap-4 items-baseline pb-3 border-b border-hairline last:border-0">
                <span className="micro-label text-ink">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-serif text-[19px] text-ink leading-snug">{q}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* G. Prepared Follow-Up */}
      <Section number={6} title="PREPARED FOLLOW-UP">
        {editingFollowup ? (
          <textarea value={followupDraft} onChange={(e) => setFollowupDraft(e.target.value)} rows={8}
            className="w-full bg-cream border border-hairline focus:border-ink outline-none p-5 text-ink text-[15px] leading-relaxed mb-3" />
        ) : (
          <pre className="bg-cream border-l-2 border-ink pl-6 pr-5 py-5 text-[15px] text-ink whitespace-pre-wrap font-sans leading-relaxed mb-4">
            {lead.suggested_followup || lead.ai_reply_draft || <span className="italic-serif">No follow-up drafted yet. Run AI analysis first.</span>}
          </pre>
        )}
        <div className="flex flex-wrap gap-2">
          {editingFollowup ? (
            <>
              <button onClick={saveFollowup} className="px-4 py-2 bg-ink text-cream text-[11px] uppercase tracking-[0.22em]">Save message</button>
              <button onClick={() => { setEditingFollowup(false); setFollowupDraft(lead.suggested_followup || ""); }} className="px-4 py-2 border border-hairline text-[11px] uppercase tracking-[0.22em] text-stone">Cancel</button>
            </>
          ) : (
            <>
              <button onClick={() => { navigator.clipboard.writeText(lead.suggested_followup || lead.ai_reply_draft || ""); toast.success("Copied"); }}
                className="flex items-center gap-2 px-4 py-2 border border-hairline text-[11px] uppercase tracking-[0.22em] hover:bg-cream"><Copy size={12} /> Copy Message</button>
              <button onClick={() => setEditingFollowup(true)}
                className="flex items-center gap-2 px-4 py-2 border border-hairline text-[11px] uppercase tracking-[0.22em] hover:bg-cream"><Edit3 size={12} /> Edit Message</button>
              <button onClick={markContacted}
                className="flex items-center gap-2 px-4 py-2 border border-hairline text-[11px] uppercase tracking-[0.22em] hover:bg-cream"><CheckCircle2 size={12} /> Mark as Contacted</button>
              <ReminderMenu onPick={setReminder} />
            </>
          )}
        </div>
        {lead.last_contacted_at && (
          <div className="italic-serif text-[13px] mt-4">Last contacted {formatRelative(lead.last_contacted_at)}</div>
        )}
        {lead.reminder_at && (
          <div className="italic-serif text-[13px] mt-1">Reminder set for {new Date(lead.reminder_at).toLocaleString()}</div>
        )}
      </Section>

      {/* H. Custom Fields */}
      {customEntries.length > 0 && (
        <Section number={7} title="CUSTOM FIELDS">
          <div className="border-t border-hairline divide-y divide-hairline">
            {customEntries.map(([k, v]) => (
              <div key={k} className="grid grid-cols-3 gap-4 py-4">
                <div className="micro-label col-span-1">{k}</div>
                <div className="col-span-2 font-serif text-[18px] text-ink">{String(v)}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* I. Notes & History */}
      <Section number={8} title="NOTES & HISTORY">
        <div className="flex gap-2 mb-5">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add an internal note…"
            className="flex-1 bg-transparent border-b border-hairline focus:border-ink outline-none py-2 text-[15px] italic-serif placeholder:italic-serif" />
          <button onClick={addNote} className="px-4 text-[11px] uppercase tracking-[0.22em] text-stone hover:text-ink">Add</button>
        </div>
        <div className="space-y-4">
          {[...activities.map((a) => ({ ...a, _kind: "note", _at: a.created_at })),
            ...history.map((h) => ({ ...h, _kind: "status", _at: h.changed_at }))]
            .sort((a, b) => new Date(b._at).getTime() - new Date(a._at).getTime())
            .map((row, i) => (
              <div key={i} className="border-l border-hairline pl-5 py-1">
                {row._kind === "note" ? (
                  <div className="font-serif text-[18px] text-ink leading-snug">{row.body}</div>
                ) : (
                  <div className="italic-serif text-[15px]">
                    Status: {STATUS_LABELS[row.from_status] || row.from_status || "—"} → <span className="text-ink not-italic font-serif">{STATUS_LABELS[row.to_status] || row.to_status}</span>
                  </div>
                )}
                <div className="micro-label mt-1.5">{new Date(row._at).toLocaleString()}</div>
              </div>
            ))}
          {activities.length === 0 && history.length === 0 && (
            <div className="italic-serif text-[16px]">No activity yet.</div>
          )}
        </div>
      </Section>
    </div>
  );
};

const Section = ({ number, title, children }: { number?: number; title: string; children: React.ReactNode }) => (
  <section className="mb-12">
    <div className="mb-5">
      <SectionMarker number={number} label={title} />
    </div>
    {children}
  </section>
);

const ReminderMenu = ({ onPick }: { onPick: (d: number) => void }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 px-4 py-2 border border-hairline text-[11px] uppercase tracking-[0.22em] hover:bg-cream">
        <Clock size={12} /> Create Reminder
      </button>
      {open && (
        <div className="absolute top-full mt-2 left-0 bg-cream border border-hairline z-10 min-w-[160px]">
          {[{ d: 1, l: "In 1 day" }, { d: 3, l: "In 3 days" }, { d: 7, l: "In 1 week" }, { d: 14, l: "In 2 weeks" }].map(({ d, l }) => (
            <button key={d} onClick={() => { onPick(d); setOpen(false); }}
              className="block w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-sand">{l}</button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeadDetail;
