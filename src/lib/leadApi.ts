import { supabase } from "@/integrations/supabase/client";
import type { LeadStatus } from "./leadTypes";

export const scoreLead = (studioId: string, leadId: string) =>
  supabase.functions.invoke("score-lead", { body: { studio_id: studioId, lead_id: leadId } });

export const updateLeadStatus = (studioId: string, leadId: string, status: LeadStatus) =>
  supabase.from("leads").update({ status }).eq("studio_id", studioId).eq("id", leadId);

export const markLeadContacted = (studioId: string, leadId: string) =>
  supabase
    .from("leads")
    .update({ status: "contacted", last_contacted_at: new Date().toISOString() })
    .eq("studio_id", studioId)
    .eq("id", leadId);

export const setLeadReminder = (studioId: string, leadId: string, days: number) =>
  supabase
    .from("leads")
    .update({ reminder_at: new Date(Date.now() + days * 86400000).toISOString() })
    .eq("studio_id", studioId)
    .eq("id", leadId);

export const saveLeadFollowup = (studioId: string, leadId: string, suggestedFollowup: string) =>
  supabase
    .from("leads")
    .update({ suggested_followup: suggestedFollowup })
    .eq("studio_id", studioId)
    .eq("id", leadId);
