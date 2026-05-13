import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { analysisStatusForAI, isOpenAIConfigured } from "../_shared/aiAvailability.ts";
import { ACTION_RISK_TIER } from "../_shared/actionTiers.ts";
import { pastedLeadSchema } from "../_shared/leadSchemas.ts";
import { buildAgentContext, recordWorkflowAgentRun, resolvePromptPackVersion } from "../_shared/orchestrator.ts";
import { adminClient, requireStudioMember, requireUser, runBackground, safeError } from "../_shared/security.ts";
import { scoreLeadRecord } from "../_shared/scoring.ts";

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  try {
    const payload = pastedLeadSchema.parse(await req.json());
    const user = await requireUser(req);
    const supabase = adminClient();
    await requireStudioMember(supabase, payload.studio_id, user.id);

    const extracted = payload.extracted;
    const aiAvailable = isOpenAIConfigured();
    const agentContext = buildAgentContext({
      studio_id: payload.studio_id,
      prompt_pack_version: resolvePromptPackVersion(aiAvailable),
      schema_version: "lead-intake-v1",
      requested_tier: ACTION_RISK_TIER.SILENT_INTERNAL,
    });
    const { data, error } = await supabase
      .from("leads")
      .insert({
        studio_id: payload.studio_id,
        full_name: extracted.full_name,
        email: extracted.email || `unknown+${crypto.randomUUID().slice(0, 8)}@pasted.avitus`,
        phone: extracted.phone || null,
        project_type: extracted.project_type || null,
        property_type: extracted.property_type || null,
        location: extracted.location || null,
        budget_range: extracted.budget_range || null,
        timeline: extracted.timeline || null,
        style_preference: extracted.style_preference || null,
        urgency: extracted.urgency || null,
        missing_info: extracted.missing_info,
        raw_inquiry: payload.raw_text,
        source: "pasted",
        created_by: user.id,
        ai_analysis_status: analysisStatusForAI(aiAvailable),
      })
      .select("id")
      .single();

    if (error) throw error;

    if (aiAvailable) runBackground(scoreLeadRecord(supabase, payload.studio_id, data.id, user.id).catch(() => null));
    else {
      runBackground(
        recordWorkflowAgentRun(supabase, agentContext, {
          lead_id: data.id,
          agent_name: "Lead Intake Router",
          service_name: "lead_intelligence",
          model: "not_configured",
          input: { source: "pasted", ai_available: false },
          structured_output_jsonb: { source: "pasted", ai_analysis_status: analysisStatusForAI(false) },
          tier: ACTION_RISK_TIER.SILENT_INTERNAL,
          status: "success",
          created_by: user.id,
        }).catch(() => null),
      );
    }
    return jsonResponse(req, { ok: true, lead_id: data.id, ai_available: aiAvailable });
  } catch (error) {
    const { status, message } = safeError(error);
    return jsonResponse(req, { ok: false, error: message }, status);
  }
});
