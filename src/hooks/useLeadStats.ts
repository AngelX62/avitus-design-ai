import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { buildLeadStats, type LeadStats, type LeadStatsLead, type LeadTimelineRange } from "@/lib/leadStats";

type LeadStatsState = {
  stats: LeadStats;
  leads: LeadStatsLead[];
  loading: boolean;
  error: string | null;
};

export const useLeadStats = (studioId?: string | null, timelineRange: LeadTimelineRange = "30D"): LeadStatsState => {
  const [leads, setLeads] = useState<LeadStatsLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const stats = useMemo(() => buildLeadStats(leads, new Date(), timelineRange), [leads, timelineRange]);

  useEffect(() => {
    let cancelled = false;

    if (!studioId) {
      setLeads([]);
      setLoading(false);
      setErrorMessage(null);
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    setErrorMessage(null);

    (async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, full_name, status, source, classification, fit_score, ai_next_action, email, phone, project_type, property_type, location, budget_range, timeline, raw_inquiry, brief, ai_analysis_status, created_at, reminder_at, last_contacted_at")
        .eq("studio_id", studioId)
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        setLeads([]);
        setLoading(false);
        setErrorMessage(error.message || "Unable to load lead statistics.");
        return;
      }

      setLeads((data ?? []) as LeadStatsLead[]);
      setLoading(false);
      setErrorMessage(null);
    })().catch((error) => {
      if (cancelled) return;
      setLeads([]);
      setLoading(false);
      setErrorMessage(error instanceof Error ? error.message : "Unable to load lead statistics.");
    });

    return () => {
      cancelled = true;
    };
  }, [studioId]);

  return { stats, leads, loading, error: errorMessage };
};
