import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useStudio } from "@/contexts/StudioContext";
import { markLeadContacted, saveLeadFollowup, scoreLead, setLeadReminder, updateLeadStatus } from "@/lib/leadApi";
import { canTransitionLeadStatus, getLeadAnalysisStatusCopy, LEAD_STATUSES, type LeadStatus } from "@/lib/leadTypes";
import { OwnerStatePanel } from "@/components/OwnerStatePanel";
import { LeadControlDeck } from "@/components/lead-detail/LeadControlDeck";
import { LeadContextStack } from "@/components/lead-detail/LeadContextStack";
import { LeadActivityRail } from "@/components/lead-detail/LeadActivityRail";
import { getReviewReasons, normalizeScoreCriteria } from "@/components/lead-detail/lead-detail-utils";

const BackLink = () => (
  <Link to="/leads" className="inline-flex items-center gap-2 micro-label text-stone hover:text-pine mb-6">
    <ArrowLeft size={12} strokeWidth={1.5} /> LEAD INBOX
  </Link>
);

const LeadDetail = () => {
  const { id } = useParams();
  const { activeStudio } = useStudio();
  const [lead, setLead] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [note, setNote] = useState("");
  const [scoring, setScoring] = useState(false);
  const [editingFollowup, setEditingFollowup] = useState(false);
  const [followupDraft, setFollowupDraft] = useState("");
  const [followupOpen, setFollowupOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const now = useMemo(() => new Date(), []);

  const load = useCallback(async () => {
    setLoading(true);
    setLead(null);
    setActivities([]);
    setHistory([]);
    if (!id || !activeStudio) {
      setLoading(false);
      return;
    }
    const [{ data }, { data: act }, { data: hist }] = await Promise.all([
      supabase.from("leads").select("*").eq("studio_id", activeStudio.id).eq("id", id).maybeSingle(),
      supabase.from("lead_activities").select("*").eq("studio_id", activeStudio.id).eq("lead_id", id).order("created_at", { ascending: false }),
      supabase.from("lead_status_history").select("*").eq("studio_id", activeStudio.id).eq("lead_id", id).order("changed_at", { ascending: false }),
    ]);
    setLead(data);
    setFollowupDraft(data?.suggested_followup || data?.ai_reply_draft || "");
    setActivities(act ?? []);
    setHistory(hist ?? []);
    setLoading(false);
  }, [activeStudio, id]);

  useEffect(() => {
    void load();
  }, [load]);

  const runAi = async () => {
    if (!activeStudio || !id) return;
    setScoring(true);
    const { data, error } = await scoreLead(activeStudio.id, id);
    setScoring(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(data?.ai_available === false ? "Analysis is not enabled yet" : "Re-analysed");
    void load();
  };

  const handleUpdateStatus = async (status: LeadStatus) => {
    if (!activeStudio || !id || !lead) return;
    const current = (LEAD_STATUSES as readonly string[]).includes(lead.status) ? (lead.status as LeadStatus) : null;
    if (current && !canTransitionLeadStatus(current, status)) {
      toast.error("That status change is not allowed");
      return;
    }
    const { error } = await updateLeadStatus(activeStudio.id, id, status);
    if (error) {
      toast.error(error.message);
      return;
    }
    void load();
  };

  const handleMarkContacted = async () => {
    if (!activeStudio || !id) return;
    await markLeadContacted(activeStudio.id, id);
    toast.success("Marked as contacted");
    void load();
  };

  const handleSetReminder = async (days: number) => {
    if (!activeStudio || !id) return;
    await setLeadReminder(activeStudio.id, id, days);
    toast.success(`Reminder set for ${days} day${days > 1 ? "s" : ""}`);
    void load();
  };

  const handleSaveFollowup = async () => {
    if (!activeStudio || !id) return;
    await saveLeadFollowup(activeStudio.id, id, followupDraft);
    setEditingFollowup(false);
    toast.success("Follow-up updated");
    void load();
  };

  const handleAddNote = async () => {
    if (!note.trim() || !activeStudio || !id) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("lead_activities").insert({ studio_id: activeStudio.id, lead_id: id, kind: "note", body: note, author_id: user?.id });
    setNote("");
    void load();
  };

  const handleCopyFollowup = () => {
    const suggested = lead?.suggested_followup || lead?.ai_reply_draft || "";
    const textToCopy = followupDraft || suggested;
    if (!textToCopy.trim()) {
      toast.info("No follow-up draft yet");
      return;
    }
    navigator.clipboard.writeText(textToCopy);
    toast.success("Copied");
  };

  if (loading) {
    return (
      <div className="px-6 md:px-12 py-10 max-w-5xl">
        <BackLink />
        <OwnerStatePanel
          eyebrow="LOADING LEAD"
          body="Checking this lead inside your active studio workspace."
        />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="px-6 md:px-12 py-10 max-w-5xl">
        <BackLink />
        <OwnerStatePanel
          eyebrow="LEAD NOT AVAILABLE"
          title="This lead is not in your active studio."
          body="It may have been removed, or the link may belong to a different studio workspace."
        />
      </div>
    );
  }

  const sb = lead.score_breakdown || {};
  const scoreCriteria = normalizeScoreCriteria(sb);
  const reviewReasons = getReviewReasons(sb);
  const analysisState = getLeadAnalysisStatusCopy(lead.ai_analysis_status, lead.ai_analysis_error);
  const aiUnavailable = lead.ai_analysis_status === "not_configured";
  const analysisPending = lead.ai_analysis_status === "pending" || lead.ai_analysis_status === "not_started";
  const analysisComplete = lead.ai_analysis_status === "complete";
  const canRunAnalysis = lead.ai_analysis_status === "failed" || analysisComplete;
  const manualReview = lead.fit_score == null ? analysisState : null;

  const aiMissingInfo: string[] = Array.isArray(lead.missing_info)
    ? lead.missing_info.filter((s: unknown): s is string => typeof s === "string" && s.length > 0)
    : [];
  const deterministicMissing: string[] = [];
  if (!lead.budget_range) deterministicMissing.push("Budget");
  if (!lead.timeline) deterministicMissing.push("Timeline");
  if (!lead.project_type) deterministicMissing.push("Project type");
  if (!lead.location) deterministicMissing.push("Location");
  if (!lead.email && !lead.phone) deterministicMissing.push("Contact details");
  const missingInfo = analysisComplete ? aiMissingInfo : deterministicMissing;

  return (
    <div className="px-6 md:px-12 py-10 max-w-5xl">
      <BackLink />

      <LeadControlDeck
        lead={lead}
        now={now}
        scoring={scoring}
        canRunAnalysis={canRunAnalysis}
        aiUnavailable={aiUnavailable}
        analysisPending={analysisPending}
        analysisState={analysisState}
        manualReview={manualReview}
        missingInfo={missingInfo}
        onRunAi={runAi}
        onMarkContacted={handleMarkContacted}
        onSetReminder={handleSetReminder}
        onOpenFollowup={() => setFollowupOpen(true)}
        onUpdateStatus={handleUpdateStatus}
      />

      <div className="rule-ornament my-10" aria-hidden />

      <LeadContextStack
        lead={lead}
        analysisState={analysisState}
        analysisComplete={analysisComplete}
        aiUnavailable={aiUnavailable}
        followupDraft={followupDraft}
        setFollowupDraft={setFollowupDraft}
        editingFollowup={editingFollowup}
        setEditingFollowup={setEditingFollowup}
        followupOpen={followupOpen}
        setFollowupOpen={setFollowupOpen}
        onSaveFollowup={handleSaveFollowup}
        onCopyFollowup={handleCopyFollowup}
        scoreCriteria={scoreCriteria}
        reviewReasons={reviewReasons}
      />

      <div className="rule-ornament my-10" aria-hidden />

      <LeadActivityRail
        activities={activities}
        history={history}
        note={note}
        setNote={setNote}
        onAddNote={handleAddNote}
      />
    </div>
  );
};

export default LeadDetail;
