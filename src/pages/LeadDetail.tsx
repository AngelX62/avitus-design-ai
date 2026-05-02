import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Copy, ArrowLeft, Edit3, CheckCircle2, Clock } from "lucide-react";
import { STATUS_LABELS, SOURCE_LABELS, formatRelative, temperatureTone } from "@/lib/format";
import { SectionMarker } from "@/components/SectionMarker";
import { StatChip } from "@/components/StatChip";
import { PipelineBar } from "@/components/PipelineBar";

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
    <div className="px-6 md:px-10 py-10 max-w-5xl">
      <Link to="/leads" className="inline-flex items-center gap-2 micro-label text-graphite hover:text-foreground mb-8"><ArrowLeft size={12} /> Inbox</Link>

      {/* A. Header */}
      <section className="pb-10 mb-12 border-b border-foreground">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="micro-label">{SOURCE_LABELS[lead.source] || lead.source}</span>
              {lead.temperature && (
                <StatChip label={lead.temperature} tone={temperatureTone(lead.temperature)} />
              )}
            </div>
            <h1 className="text-[44px] md:text-[64px] text-foreground leading-[1.02] tracking-[-0.035em]">{lead.full_name}</h1>
            <div className="text-[15px] text-graphite mt-3 tabular">{lead.email}{lead.phone ? ` · ${lead.phone}` : ""}</div>
          </div>
          <div className="min-w-[260px]">
            {lead.fit_score != null ? (
              <>
                <div className="micro-label mb-3">Fit score</div>
                <div className="flex items-baseline gap-3">
                  <div className="serif-numeral text-[80px] md:text-[96px]">{lead.fit_score}</div>
                  <div className="text-[14px] text-graphite tabular">/ 100</div>
                </div>
                <div className="h-[6px] bg-rule mt-3">
                  <div className="h-full bg-foreground" style={{ width: `${lead.fit_score}%` }} />
                </div>
              </>
            ) : (
              <button onClick={runAi} disabled={scoring} className="flex items-center gap-2 px-4 py-2.5 border border-foreground text-[11px] uppercase tracking-[0.16em] hover:bg-panel disabled:opacity-50">
                <Sparkles size={12} /> {scoring ? "Analysing…" : "Analyse with AI"}
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-6 pt-8 mt-8 border-t border-rule">
          <div>
            <div className="micro-label mb-2">Status</div>
            <select value={lead.status} onChange={(e) => updateStatus(e.target.value)}
              className="bg-transparent border border-rule focus:border-foreground outline-none px-3 py-2 text-sm text-foreground">
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>)}
            </select>
          </div>
          {lead.ai_next_action && (
            <div className="flex-1 min-w-[200px]">
              <div className="micro-label mb-2">Recommended next action</div>
              <div className="text-[16px] text-foreground leading-snug">{lead.ai_next_action}</div>
            </div>
          )}
          {lead.fit_score != null && (
            <button onClick={runAi} disabled={scoring} className="text-[11px] text-graphite hover:text-foreground uppercase tracking-[0.16em]">
              {scoring ? "Re-analysing…" : "Re-analyse"}
            </button>
          )}
        </div>
      </section>

      <Section number={2} title="Raw inquiry">
        <pre className="bg-panel border-l border-foreground pl-6 pr-5 py-5 text-[14px] text-foreground whitespace-pre-wrap font-sans leading-relaxed">
          {lead.raw_inquiry || lead.brief || <span className="text-graphite italic">No original message captured.</span>}
        </pre>
      </Section>

      {lead.ai_summary && (
        <Section number={3} title="AI summary">
          <p className="text-[20px] text-foreground leading-snug max-w-3xl tracking-[-0.015em]">{lead.ai_summary}</p>
        </Section>
      )}

      <Section number={4} title="Extracted fields">
        <div className="grid grid-cols-2 md:grid-cols-4 border-t border-rule">
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
            <div key={label as string} className={`py-5 px-5 first:pl-0 border-b border-rule ${i % 4 !== 0 ? "md:border-l border-rule" : ""}`}>
              <div className="micro-label mb-2">{label}</div>
              <div className="text-[15px] text-foreground leading-tight">{value || <span className="text-graphite italic">—</span>}</div>
            </div>
          ))}
        </div>
      </Section>

      {Object.keys(sb).length > 0 && (
        <Section number={5} title="Score breakdown">
          <div className="space-y-4 max-w-2xl">
            {breakdown.map(({ key, label }) => (
              <PipelineBar key={key} label={label} value={sb[key] ?? "—"} pct={Number(sb[key]) || 0} />
            ))}
          </div>
        </Section>
      )}

      {lead.missing_info?.length > 0 && (
        <Section number={6} title="Missing information">
          <ul className="space-y-3 max-w-2xl">
            {lead.missing_info.map((q: string, i: number) => (
              <li key={i} className="flex gap-4 items-baseline pb-3 border-b border-rule last:border-0">
                <span className="micro-label tabular text-foreground">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[15px] text-foreground leading-snug">{q}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section number={7} title="Prepared follow-up">
        {editingFollowup ? (
          <textarea value={followupDraft} onChange={(e) => setFollowupDraft(e.target.value)} rows={8}
            className="w-full bg-panel border border-rule focus:border-foreground outline-none p-5 text-foreground text-[15px] leading-relaxed mb-3" />
        ) : (
          <pre className="bg-panel border-l border-foreground pl-6 pr-5 py-5 text-[14px] text-foreground whitespace-pre-wrap font-sans leading-relaxed mb-4">
            {lead.suggested_followup || lead.ai_reply_draft || <span className="text-graphite italic">No follow-up drafted yet. Run AI analysis first.</span>}
          </pre>
        )}
        <div className="flex flex-wrap gap-2">
          {editingFollowup ? (
            <>
              <button onClick={saveFollowup} className="px-4 py-2 bg-foreground text-background text-[11px] uppercase tracking-[0.16em]">Save message</button>
              <button onClick={() => { setEditingFollowup(false); setFollowupDraft(lead.suggested_followup || ""); }} className="px-4 py-2 border border-rule text-[11px] uppercase tracking-[0.16em] text-graphite">Cancel</button>
            </>
          ) : (
            <>
              <button onClick={() => { navigator.clipboard.writeText(lead.suggested_followup || lead.ai_reply_draft || ""); toast.success("Copied"); }}
                className="flex items-center gap-2 px-4 py-2 border border-foreground text-[11px] uppercase tracking-[0.16em] hover:bg-panel"><Copy size={12} /> Copy</button>
              <button onClick={() => setEditingFollowup(true)}
                className="flex items-center gap-2 px-4 py-2 border border-rule text-[11px] uppercase tracking-[0.16em] hover:bg-panel"><Edit3 size={12} /> Edit</button>
              <button onClick={markContacted}
                className="flex items-center gap-2 px-4 py-2 border border-rule text-[11px] uppercase tracking-[0.16em] hover:bg-panel"><CheckCircle2 size={12} /> Mark contacted</button>
              <ReminderMenu onPick={setReminder} />
            </>
          )}
        </div>
        {lead.last_contacted_at && (
          <div className="text-[12px] text-graphite mt-4">Last contacted {formatRelative(lead.last_contacted_at)}</div>
        )}
        {lead.reminder_at && (
          <div className="text-[12px] text-graphite mt-1">Reminder set for {new Date(lead.reminder_at).toLocaleString()}</div>
        )}
      </Section>

      {customEntries.length > 0 && (
        <Section number={8} title="Custom fields">
          <div className="border-t border-rule divide-y divide-rule">
            {customEntries.map(([k, v]) => (
              <div key={k} className="grid grid-cols-3 gap-4 py-4">
                <div className="micro-label col-span-1">{k}</div>
                <div className="col-span-2 text-[15px] text-foreground">{String(v)}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section number={9} title="Notes & history">
        <div className="flex gap-2 mb-5">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add an internal note…"
            className="flex-1 bg-transparent border-b border-rule focus:border-foreground outline-none py-2 text-[14px] placeholder:text-graphite" />
          <button onClick={addNote} className="px-4 text-[11px] uppercase tracking-[0.16em] text-graphite hover:text-foreground">Add</button>
        </div>
        <div className="space-y-4">
          {[...activities.map((a) => ({ ...a, _kind: "note", _at: a.created_at })),
            ...history.map((h) => ({ ...h, _kind: "status", _at: h.changed_at }))]
            .sort((a, b) => new Date(b._at).getTime() - new Date(a._at).getTime())
            .map((row, i) => (
              <div key={i} className="border-l border-rule pl-5 py-1">
                {row._kind === "note" ? (
                  <div className="text-[15px] text-foreground leading-snug">{row.body}</div>
                ) : (
                  <div className="text-[14px] text-graphite">
                    Status: {STATUS_LABELS[row.from_status] || row.from_status || "—"} → <span className="text-foreground">{STATUS_LABELS[row.to_status] || row.to_status}</span>
                  </div>
                )}
                <div className="micro-label mt-1.5 tabular">{new Date(row._at).toLocaleString()}</div>
              </div>
            ))}
          {activities.length === 0 && history.length === 0 && (
            <div className="text-[14px] text-graphite italic">No activity yet.</div>
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
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 px-4 py-2 border border-rule text-[11px] uppercase tracking-[0.16em] hover:bg-panel">
        <Clock size={12} /> Reminder
      </button>
      {open && (
        <div className="absolute top-full mt-2 left-0 bg-background border border-foreground z-10 min-w-[160px]">
          {[{ d: 1, l: "In 1 day" }, { d: 3, l: "In 3 days" }, { d: 7, l: "In 1 week" }, { d: 14, l: "In 2 weeks" }].map(({ d, l }) => (
            <button key={d} onClick={() => { onPick(d); setOpen(false); }}
              className="block w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-panel">{l}</button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeadDetail;
