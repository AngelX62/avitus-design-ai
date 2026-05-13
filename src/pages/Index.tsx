import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { OwnerStatePanel } from "@/components/OwnerStatePanel";
import { ArrowUpRight, FileText, MessageSquare, Upload, Activity, Copy, ExternalLink, Inbox } from "lucide-react";
import { toast } from "sonner";
import { SOURCE_LABELS, formatRelative } from "@/lib/format";
import { getTimeGreeting } from "@/lib/timeGreeting";
import { useStudio } from "@/contexts/StudioContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLeadStats } from "@/hooks/useLeadStats";
import { LeadStatsCards } from "@/components/overview/LeadStatsCards";
import { LeadStatusChart } from "@/components/overview/LeadStatusChart";
import { LeadsOverTimeChart } from "@/components/overview/LeadsOverTimeChart";
import { LeadSourceChart } from "@/components/overview/LeadSourceChart";
import type { LeadTimelineRange } from "@/lib/leadStats";
import { ActionQueuePanel } from "@/components/overview/ActionQueuePanel";
import { buildActionQueueItems } from "@/lib/actionQueue";
import { PriorityLeadsPanel } from "@/components/overview/PriorityLeadsPanel";
import { selectPriorityLeads } from "@/lib/leadPriority";

const Index = () => {
  const { activeStudio } = useStudio();
  const { user } = useAuth();
  const [timelineRange, setTimelineRange] = useState<LeadTimelineRange>("30D");
  const { stats: leadStats, leads: leadRows, loading: statsLoading, error: statsError } = useLeadStats(activeStudio?.id, timelineRange);
  const [profileName, setProfileName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [now, setNow] = useState(() => new Date());
  const actionQueueItems = useMemo(() => buildActionQueueItems(leadStats), [leadStats]);
  const dueFollowupIds = useMemo(
    () => new Set(leadStats.dueFollowups.map((l) => l.id)),
    [leadStats.dueFollowups],
  );
  const priorityRows = useMemo(() => {
    const duplicateIds = new Set(leadStats.duplicateGroups.flatMap((group) => group.lead_ids));
    return leadRows.map((lead) => ({
      ...lead,
      possible_duplicate: duplicateIds.has(lead.id),
    }));
  }, [leadRows, leadStats.duplicateGroups]);
  const priorityLeads = useMemo(
    () => selectPriorityLeads(priorityRows, now, dueFollowupIds, 5),
    [priorityRows, now, dueFollowupIds],
  );

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setProfileName("");
      return () => {
        cancelled = true;
      };
    }

    const fallbackName = user.user_metadata?.full_name || user.email?.split("@")[0] || "there";

    (async () => {
      const { data } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      if (cancelled) return;
      setProfileName(data?.full_name || fallbackName);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    if (!activeStudio) {
      setBusinessName("");
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      const { data } = await supabase
        .from("studio_settings")
        .select("studio_name")
        .eq("studio_id", activeStudio.id)
        .maybeSingle();
      if (cancelled) return;
      setBusinessName(data?.studio_name || activeStudio.name);
    })();

    return () => {
      cancelled = true;
    };
  }, [activeStudio]);

  const welcomeName = profileName || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "there";
  const studioLabel = businessName || activeStudio?.name || "Studio workspace";
  const timeGreeting = getTimeGreeting(now);

  return (
    <div className="px-6 md:px-12 py-10 max-w-6xl">
      <PageHeader
        accent="overview"
        eyebrow="STUDIO · OVERVIEW"
        title={`${timeGreeting} ${welcomeName}.`}
        subtitle={studioLabel}
      />

      <OverviewQuickActions studioSlug={activeStudio?.slug} />

      {statsLoading ? (
        <OverviewLoading />
      ) : statsError ? (
        <OverviewError message={statsError} />
      ) : leadStats.isEmpty ? (
        <NoLeadData studioSlug={activeStudio?.slug} />
      ) : (
        <>
          <ActionQueuePanel items={actionQueueItems} />

          <PriorityLeadsPanel leads={priorityLeads} now={now} />

          <LeadStatsCards summary={leadStats.summary} />

          <div className="grid xl:grid-cols-2 gap-6 mb-5">
            <LeadStatusChart data={leadStats.statusRows} />
            <LeadsOverTimeChart
              data={leadStats.timelineRows}
              seasonality={leadStats.seasonality}
              range={timelineRange}
              onRangeChange={setTimelineRange}
            />
          </div>

          <div className="mb-7">
            <LeadSourceChart data={leadStats.sourceRows} />
          </div>

          {leadStats.dueFollowups.length > 0 && (
            <div className="border border-attn-rule/40 bg-card mb-6 shadow-rest-lit border-l-[3px] border-l-attn">
              <div className="px-5 md:px-6 py-3 border-b border-attn-rule/30 bg-attn-soft/40 micro-label text-attn">FOLLOW-UPS DUE</div>
              {leadStats.dueFollowups.slice(0, 5).map((lead) => (
                <Link key={lead.id} to={`/leads/${lead.id}`} className="group flex items-center justify-between gap-4 px-5 md:px-6 py-3 border-b border-border last:border-0 transition-colors hover:bg-attn-soft/40">
                  <div>
                    <div className="text-sm text-ink">{lead.full_name}</div>
                    <div className="text-xs text-stone mt-0.5">
                      {lead.reminder_at ? `Reminder ${formatRelative(lead.reminder_at)}` : "Reminder is due"}
                    </div>
                  </div>
                  <ArrowUpRight size={15} strokeWidth={1.25} className="text-stone transition-colors group-hover:text-attn" />
                </Link>
              ))}
            </div>
          )}

          <section className="bg-hairline bg-top bg-no-repeat bg-[length:100%_1px] pt-8 mt-2">
            <div className="flex items-baseline justify-between mb-4 px-1">
              <div className="micro-label flex items-center gap-2"><Activity size={11} /> RECENT ACTIVITY</div>
              <Link to="/leads" className="micro-label text-stone hover:text-sage-deep transition-colors">VIEW INBOX →</Link>
            </div>
            <div className="divide-y divide-border">
              {leadStats.recentEvents.map((event) => (
                <Link key={event.id} to={`/leads/${event.id}`} className="flex items-center gap-4 px-1 md:px-2 py-3.5 transition-colors hover:bg-sage-soft/25 group">
                  <div className="w-7 h-7 flex items-center justify-center bg-sage-soft text-sage-deep shrink-0 rounded-sm">
                    {iconForSource(event.source)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-ink truncate">{event.name}</div>
                    <div className="text-xs text-stone mt-0.5">
                      {SOURCE_LABELS[event.source || ""] || "Other"} · new lead
                    </div>
                  </div>
                  <div className="text-xs text-stone shrink-0">{formatRelative(event.at)}</div>
                  <ArrowUpRight size={15} strokeWidth={1.25} className="text-stone group-hover:text-sage-deep shrink-0 transition-colors" />
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

const OverviewLoading = () => (
  <OwnerStatePanel
    eyebrow="LOADING OVERVIEW"
    body="Gathering leads, reminders, and recent activity."
  />
);

const OverviewError = ({ message }: { message: string }) => (
  <OwnerStatePanel
    eyebrow="STATS UNAVAILABLE"
    title="Lead statistics could not load."
    body={message}
  />
);

const OverviewQuickActions = ({ studioSlug }: { studioSlug?: string }) => {
  const intakePath = studioSlug ? `/intake/${studioSlug}` : "";
  const intakeUrl = studioSlug ? `${window.location.origin}${intakePath}` : "";

  const copyIntakeLink = async () => {
    if (!intakeUrl) {
      toast.error("Set up a studio workspace before copying the intake link");
      return;
    }

    try {
      await navigator.clipboard.writeText(intakeUrl);
      toast.success("Intake link copied");
    } catch {
      toast.error("Could not copy intake link");
    }
  };

  const disabledClass = !studioSlug ? "opacity-50 cursor-not-allowed" : "";

  return (
    <div className="mb-7 flex flex-col gap-3 border-b border-border pb-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="micro-label">OWNER ACTIONS</div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copyIntakeLink}
          disabled={!studioSlug}
          className={`flex items-center gap-2 px-3 py-2 border border-border text-[10px] uppercase tracking-[0.16em] text-stone hover:border-sage hover:bg-sage-soft/60 hover:text-sage-deep transition-all duration-200 hover:shadow-rest active:translate-y-px ${disabledClass}`}
        >
          <Copy size={13} /> Copy Intake Link
        </button>
        <a
          href={intakePath || undefined}
          target="_blank"
          rel="noreferrer"
          aria-disabled={!studioSlug}
          className={`flex items-center gap-2 px-3 py-2 border border-border text-[10px] uppercase tracking-[0.16em] text-stone hover:border-sage hover:bg-sage-soft/60 hover:text-sage-deep transition-all duration-200 hover:shadow-rest active:translate-y-px ${disabledClass}`}
          onClick={(event) => {
            if (!studioSlug) event.preventDefault();
          }}
        >
          <ExternalLink size={13} /> Open Intake Form
        </a>
        <Link to="/leads/paste" className="flex items-center gap-2 px-3 py-2 border border-border text-[10px] uppercase tracking-[0.16em] text-stone hover:border-sage hover:bg-sage-soft/60 hover:text-sage-deep transition-all duration-200 hover:shadow-rest active:translate-y-px">
          <MessageSquare size={13} /> Paste Message
        </Link>
        <Link to="/import" className="flex items-center gap-2 px-3 py-2 border border-border text-[10px] uppercase tracking-[0.16em] text-stone hover:border-sage hover:bg-sage-soft/60 hover:text-sage-deep transition-all duration-200 hover:shadow-rest active:translate-y-px">
          <Upload size={13} /> Import Sheet
        </Link>
        <Link to="/leads" className="flex items-center gap-2 px-3 py-2 border border-ink/20 text-[10px] uppercase tracking-[0.16em] text-ink hover:bg-ink hover:text-ivory transition-colors">
          <Inbox size={13} /> View Lead Inbox
        </Link>
      </div>
    </div>
  );
};

const NoLeadData = ({ studioSlug }: { studioSlug?: string }) => (
  <OwnerStatePanel
    eyebrow="NO LEAD DATA YET"
    title="New leads will appear here once they enter Avitus."
    body="Start with one real inquiry. Avitus will build owner statistics from database-backed lead records only."
    actions={
      <>
        <a
          href={studioSlug ? `/intake/${studioSlug}` : "/settings"}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 border border-border text-xs uppercase tracking-[0.18em] text-ink hover:border-sage hover:bg-sage-soft/50 transition-colors"
        >
          <FileText size={13} /> Open Intake Form
        </a>
        <Link to="/leads/paste" className="flex items-center gap-2 px-4 py-2.5 border border-border text-xs uppercase tracking-[0.18em] text-ink hover:border-sage hover:bg-sage-soft/50 transition-colors">
          <MessageSquare size={13} /> Paste Message
        </Link>
        <Link to="/import" className="flex items-center gap-2 px-4 py-2.5 bg-ink text-ivory text-xs uppercase tracking-[0.18em] hover:bg-ink/90 transition-colors">
          <Upload size={13} /> Import Sheet
        </Link>
      </>
    }
  />
);

const iconForSource = (s?: string) => {
  if (s === "intake_form") return <FileText size={12} />;
  if (s === "pasted") return <MessageSquare size={12} />;
  if (s === "imported") return <Upload size={12} />;
  return <FileText size={12} />;
};

export default Index;
