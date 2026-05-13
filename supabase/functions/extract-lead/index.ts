import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { createFallbackExtractedLead, isOpenAIConfigured } from "../_shared/aiAvailability.ts";
import { ACTION_RISK_TIER } from "../_shared/actionTiers.ts";
import { extractedLeadSchema, extractRequestSchema } from "../_shared/leadSchemas.ts";
import { callOpenAIJson, openAIModel } from "../_shared/openai.ts";
import { buildAgentContext, recordWorkflowAgentRun, resolvePromptPackVersion } from "../_shared/orchestrator.ts";
import { adminClient, requireStudioMember, requireUser, safeError } from "../_shared/security.ts";

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  try {
    const payload = extractRequestSchema.parse(await req.json());
    const user = await requireUser(req);
    const supabase = adminClient();
    await requireStudioMember(supabase, payload.studio_id, user.id);
    const aiAvailable = isOpenAIConfigured();

    const { data: studio } = await supabase
      .from("studio_settings")
      .select("*")
      .eq("studio_id", payload.studio_id)
      .maybeSingle();

    const agentContext = buildAgentContext({
      studio_id: payload.studio_id,
      studio,
      prompt_pack_version: resolvePromptPackVersion(aiAvailable),
      schema_version: "lead-extraction-v1",
      requested_tier: ACTION_RISK_TIER.SILENT_INTERNAL,
    });

    if (!aiAvailable) {
      const extracted = extractedLeadSchema.parse(createFallbackExtractedLead(payload.raw_text, payload.source));
      await recordWorkflowAgentRun(supabase, agentContext, {
        agent_name: "Lead Extraction Fallback",
        service_name: "lead_intelligence",
        model: "not_configured",
        input: { source: payload.source, ai_available: false },
        structured_output_jsonb: extracted,
        raw_text: payload.raw_text,
        tier: ACTION_RISK_TIER.SILENT_INTERNAL,
        status: "success",
        created_by: user.id,
      }).catch(() => null);
      return jsonResponse(req, { ok: true, ai_available: false, extracted });
    }

    try {
      const result = await callOpenAIJson(
        [
          {
            role: "system",
            content: `Extract lead data for an interior design studio. Studio currency is ${agentContext.currency}.
Return only JSON with: full_name, email, phone, project_type, property_type, location, budget_range, timeline, style_preference, urgency, missing_info.
Do not invent details. If a name is missing, use a short label like "Instagram lead" or "WhatsApp lead".`,
          },
          {
            role: "user",
            content: `Source: ${payload.source}\n\nMessage:\n${payload.raw_text}`,
          },
        ],
        { temperature: 0 },
      );

      const extracted = extractedLeadSchema.parse(result);
      await recordWorkflowAgentRun(supabase, agentContext, {
        agent_name: "Lead Extraction Service",
        service_name: "lead_intelligence",
        model: openAIModel(),
        input: { source: payload.source, ai_available: true },
        structured_output_jsonb: extracted,
        raw_text: payload.raw_text,
        tier: ACTION_RISK_TIER.SILENT_INTERNAL,
        status: "success",
        created_by: user.id,
      }).catch(() => null);
      return jsonResponse(req, { ok: true, ai_available: true, extracted });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message.slice(0, 300) : "AI extraction failed";
      await recordWorkflowAgentRun(supabase, agentContext, {
        agent_name: "Lead Extraction Service",
        service_name: "lead_intelligence",
        model: openAIModel(),
        input: { source: payload.source, ai_available: true },
        structured_output_jsonb: { error: errorMessage },
        raw_text: payload.raw_text,
        tier: ACTION_RISK_TIER.SILENT_INTERNAL,
        status: "failed",
        created_by: user.id,
      }).catch(() => null);
      throw error;
    }
  } catch (error) {
    const { status, message } = safeError(error);
    return jsonResponse(req, { ok: false, error: message }, status);
  }
});
