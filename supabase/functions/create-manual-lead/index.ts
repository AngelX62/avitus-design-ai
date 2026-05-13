import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { isOpenAIConfigured } from "../_shared/aiAvailability.ts";
import { ACTION_RISK_TIER } from "../_shared/actionTiers.ts";
import { manualLeadSchema } from "../_shared/leadSchemas.ts";
import { buildManualLeadInsert } from "../_shared/manualLead.ts";
import { buildAgentContext, recordWorkflowAgentRun, resolvePromptPackVersion } from "../_shared/orchestrator.ts";
import { adminClient, requireStudioMember, requireUser, runBackground, safeError } from "../_shared/security.ts";
import { scoreLeadRecord } from "../_shared/scoring.ts";

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  try {
    const payload = manualLeadSchema.parse(await req.json());
    const user = await requireUser(req);
    const supabase = adminClient();
    await requireStudioMember(supabase, payload.studio_id, user.id);

    const aiAvailable = isOpenAIConfigured();
    const agentContext = buildAgentContext({
      studio_id: payload.studio_id,
      prompt_pack_version: resolvePromptPackVersion(aiAvailable),
      schema_version: "lead-intake-v1",
      requested_tier: ACTION_RISK_TIER.SILENT_INTERNAL,
    });
    const { data, error } = await supabase
      .from("leads")
      .insert(buildManualLeadInsert(payload, user.id, aiAvailable))
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
          input: { source: "manual", ai_available: false },
          structured_output_jsonb: { source: "manual", ai_analysis_status: "not_configured" },
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
