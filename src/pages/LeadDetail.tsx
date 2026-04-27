import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";
import { Sparkles, Copy, ArrowLeft } from "lucide-react";

const LeadDetail = () => {
  const { id } = useParams();
  const [lead, setLead] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [note, setNote] = useState("");
  const [scoring, setScoring] = useState(false);

  useEffect(() => { if (id) void load(); }, [id]);
  const load = async () => {
    const { data } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
    setLead(data);
    const { data: act } = await supabase.from("lead_activities").select("*").eq("lead_id", id).order("created_at", { ascending: false });
    setActivities(act ?? []);
  };

  const runAi = async () => {
    setScoring(true);
    try {
      const { error } = await supabase.functions.invoke("score-lead", { body: { lead_id: id } });
      if (error) throw error;
      toast.success("Lead analysed");
      void load();
    } catch (e: any) {
      toast.error(e.message || "AI failed");
    } finally { setScoring(false); }
  };

  const addNote = async () => {
    if (!note.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("lead_activities").insert({ lead_id: id, kind: "note", body: note, author_id: user?.id });
    setNote("");
    void load();
  };

  const convert = async () => {
    const { data: project, error } = await supabase.from("projects").insert({
      name: `${lead.full_name} — ${lead.project_type || "Project"}`,
      client_name: lead.full_name, lead_id: lead.id, description: lead.brief,
    }).select().single();
    if (error) return toast.error(error.message);
    await supabase.from("leads").update({ status: "won" }).eq("id", id);
    toast.success("Project created");
    window.location.href = `/projects/${project.id}`;
  };

  if (!lead) return <div className="p-12 micro-label">Loading…</div>;

  return (
    <div className="px-12 py-12 max-w-6xl">
      <Link to="/leads" className="inline-flex items-center gap-2 micro-label text-stone hover:text-ink mb-6"><ArrowLeft size={12} /> ALL LEADS</Link>
      <PageHeader
        eyebrow={`LEAD · ${lead.status.toUpperCase()}`}
        title={lead.full_name}
        subtitle={`${lead.email}${lead.phone ? ` · ${lead.phone}` : ""}`}
        actions={
          <>
            <button onClick={runAi} disabled={scoring} className="flex items-center gap-2 px-4 py-2.5 border border-border text-xs uppercase tracking-[0.18em] hover:bg-secondary disabled:opacity-50">
              <Sparkles size={13} /> {scoring ? "Analysing…" : lead.ai_processed_at ? "Re-analyse" : "Analyse with AI"}
            </button>
            <button onClick={convert} className="px-4 py-2.5 bg-ink text-ivory text-xs uppercase tracking-[0.18em] hover:bg-ink/90">Convert to project</button>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-12">
        <div className="col-span-2 space-y-10">
          {lead.ai_summary && (
            <section className="bg-sand/30 border border-border p-8">
              <div className="micro-label mb-4 flex items-center gap-2"><Sparkles size={11} /> AI ASSESSMENT</div>
              <div className="flex items-baseline gap-6 mb-6">
                <div className="font-serif text-6xl text-ink leading-none">{lead.fit_score}</div>
                <div>
                  <div className="micro-label">FIT SCORE</div>
                  <div className="text-sm text-ink mt-1">{scoreLabel(lead.fit_score)}</div>
                </div>
              </div>
              <p className="text-ink text-[15px] leading-relaxed mb-6">{lead.ai_summary}</p>
              {lead.ai_next_action && (
                <div className="pt-6 border-t border-border/60">
                  <div className="micro-label mb-2">SUGGESTED NEXT ACTION</div>
                  <div className="text-ink text-sm">{lead.ai_next_action}</div>
                </div>
              )}
              {lead.ai_red_flags?.length > 0 && (
                <div className="pt-6 border-t border-border/60 mt-6">
                  <div className="micro-label mb-2 text-destructive">FLAGS</div>
                  <ul className="text-sm text-ink space-y-1">{lead.ai_red_flags.map((f: string, i: number) => <li key={i}>· {f}</li>)}</ul>
                </div>
              )}
            </section>
          )}

          {lead.ai_reply_draft && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="micro-label">DRAFTED REPLY</div>
                <button onClick={() => { navigator.clipboard.writeText(lead.ai_reply_draft); toast.success("Copied"); }} className="micro-label text-stone hover:text-ink flex items-center gap-1.5"><Copy size={11} /> COPY</button>
              </div>
              <pre className="bg-card border border-border p-6 text-sm text-ink whitespace-pre-wrap font-sans leading-relaxed">{lead.ai_reply_draft}</pre>
            </section>
          )}

          <section>
            <div className="micro-label mb-4">ORIGINAL BRIEF</div>
            <p className="text-ink text-[15px] leading-relaxed">{lead.brief || <span className="text-stone">No brief provided.</span>}</p>
          </section>

          <section>
            <div className="micro-label mb-4">ACTIVITY</div>
            <div className="flex gap-2 mb-4">
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note…" className="flex-1 bg-transparent border-b border-border focus:border-ink outline-none py-2 text-sm" />
              <button onClick={addNote} className="px-4 text-xs uppercase tracking-[0.18em] text-stone hover:text-ink">Add</button>
            </div>
            <div className="space-y-3">
              {activities.map((a) => (
                <div key={a.id} className="border-l border-border pl-4 py-1">
                  <div className="text-sm text-ink">{a.body}</div>
                  <div className="text-xs text-stone mt-1">{new Date(a.created_at).toLocaleString()}</div>
                </div>
              ))}
              {activities.length === 0 && <div className="text-sm text-stone">No activity yet.</div>}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <Detail label="Project type" value={lead.project_type} />
          <Detail label="Rooms" value={lead.rooms?.join(", ")} />
          <Detail label="Budget" value={lead.budget_range} />
          <Detail label="Timeline" value={lead.timeline} />
          <Detail label="Location" value={lead.location} />
          <Detail label="Source" value={lead.source} />
          <Detail label="Submitted" value={new Date(lead.created_at).toLocaleDateString()} />
        </aside>
      </div>
    </div>
  );
};

const Detail = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <div className="micro-label mb-1.5">{label}</div>
    <div className="text-sm text-ink">{value || <span className="text-stone">—</span>}</div>
  </div>
);

const scoreLabel = (s?: number | null) => {
  if (s == null) return "Not yet scored";
  if (s >= 80) return "Excellent fit";
  if (s >= 60) return "Strong fit";
  if (s >= 40) return "Moderate fit";
  return "Low fit";
};

export default LeadDetail;