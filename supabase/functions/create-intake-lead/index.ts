import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { analysisStatusForAI, isOpenAIConfigured } from "../_shared/aiAvailability.ts";
import { ACTION_RISK_TIER } from "../_shared/actionTiers.ts";
import { validatePublicIntakeSafety } from "../_shared/intakeSafety.ts";
import { intakeLeadSchema } from "../_shared/leadSchemas.ts";
import { buildAgentContext, recordWorkflowAgentRun, resolvePromptPackVersion } from "../_shared/orchestrator.ts";
import { adminClient, runBackground, safeError } from "../_shared/security.ts";
import { scoreLeadRecord } from "../_shared/scoring.ts";

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  try {
    const rawPayload = await req.json();
    const intakeSafety = validatePublicIntakeSafety(rawPayload);
    if (!intakeSafety.ok) return jsonResponse(req, { ok: false, error: intakeSafety.error }, intakeSafety.status);
    if (intakeSafety.ignored) return jsonResponse(req, { ok: true, ignored: true });

    const payload = intakeLeadSchema.parse(rawPayload);
    const supabase = adminClient();

    const { data: publicStudio, error: studioLookupError } = await supabase
      .from("studios")
      .select("id")
      .eq("slug", payload.studio_slug!.toLowerCase())
      .maybeSingle();
    if (studioLookupError) throw studioLookupError;

    const studioId = publicStudio?.id;
    if (!studioId) return jsonResponse(req, { ok: false, error: "Valid studio required" }, 400);
    const aiAvailable = isOpenAIConfigured();
    const agentContext = buildAgentContext({
      studio_id: studioId,
      prompt_pack_version: resolvePromptPackVersion(aiAvailable),
      schema_version: "lead-intake-v1",
      requested_tier: ACTION_RISK_TIER.SILENT_INTERNAL,
    });

    const { data, error } = await supabase
      .from("leads")
      .insert({
        studio_id: studioId,
        full_name: payload.full_name,
        email: payload.email || `unknown+${crypto.randomUUID().slice(0, 8)}@intake.avitus`,
        phone: payload.phone || null,
        project_type: payload.project_type || null,
        rooms: payload.rooms,
        budget_range: payload.budget_range || null,
        timeline: payload.timeline || null,
        location: payload.location || null,
        brief: payload.brief,
        raw_inquiry: payload.brief,
        source: "intake_form",
        ai_analysis_status: analysisStatusForAI(aiAvailable),
      })
      .select("id")
      .single();

    if (error) throw error;

    if (aiAvailable) runBackground(scoreLeadRecord(supabase, studioId, data.id, null).catch(() => null));
    else {
      runBackground(
        recordWorkflowAgentRun(supabase, agentContext, {
          lead_id: data.id,
          agent_name: "Lead Intake Router",
          service_name: "lead_intelligence",
          model: "not_configured",
          input: { source: "intake_form", ai_available: false },
          structured_output_jsonb: { source: "intake_form", ai_analysis_status: analysisStatusForAI(false) },
          tier: ACTION_RISK_TIER.SILENT_INTERNAL,
          status: "success",
        }).catch(() => null),
      );
    }
    return jsonResponse(req, { ok: true, lead_id: data.id, ai_available: aiAvailable });
  } catch (error) {
    const { status, message } = safeError(error);
    return jsonResponse(req, { ok: false, error: message }, status);
  }
});
