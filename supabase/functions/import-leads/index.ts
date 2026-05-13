import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { analysisStatusForAI, isOpenAIConfigured } from "../_shared/aiAvailability.ts";
import { ACTION_RISK_TIER } from "../_shared/actionTiers.ts";
import { importLeadRequestSchema } from "../_shared/leadSchemas.ts";
import { normalizeImportRow } from "../_shared/importHelpers.ts";
import { buildAgentContext, recordWorkflowAgentRun, resolvePromptPackVersion } from "../_shared/orchestrator.ts";
import { adminClient, requireStudioMember, requireUser, runBackground, safeError } from "../_shared/security.ts";
import { scoreLeadRecord } from "../_shared/scoring.ts";

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  try {
    const payload = importLeadRequestSchema.parse(await req.json());
    const user = await requireUser(req);
    const supabase = adminClient();
    await requireStudioMember(supabase, payload.studio_id, user.id);
    const aiAvailable = isOpenAIConfigured();
    const agentContext = buildAgentContext({
      studio_id: payload.studio_id,
      prompt_pack_version: resolvePromptPackVersion(aiAvailable),
      schema_version: "lead-import-v1",
      requested_tier: ACTION_RISK_TIER.SILENT_INTERNAL,
    });

    const inserted: string[] = [];
    let skipped = 0;
    let preservedCustomFieldCount = 0;
    const skippedReasons: Array<{ row_number: number; reason: string }> = [];

    for (const [index, row] of payload.rows.entries()) {
      const normalized = normalizeImportRow(row, payload.mapping);
      preservedCustomFieldCount += normalized.customFieldCount;

      if (normalized.skippedReason) {
        skipped += 1;
        skippedReasons.push({ row_number: index + 2, reason: normalized.skippedReason });
        continue;
      }

      const lead: Record<string, unknown> = {
        ...normalized.lead,
        studio_id: payload.studio_id,
        source: "imported",
        imported_by: user.id,
        created_by: user.id,
        ai_analysis_status: analysisStatusForAI(aiAvailable),
      };
      if (!lead.email) lead.email = `unknown+${crypto.randomUUID().slice(0, 8)}@import.avitus`;

      const { data, error } = await supabase.from("leads").insert(lead).select("id").single();
      if (error) {
        skipped += 1;
        skippedReasons.push({ row_number: index + 2, reason: "Database insert failed" });
        continue;
      }
      inserted.push(data.id);
    }

    const scoringQueued = aiAvailable ? inserted.slice(0, 25).length : 0;
    if (aiAvailable) {
      runBackground(
        Promise.all(
          inserted.slice(0, 25).map((leadId) =>
            scoreLeadRecord(supabase, payload.studio_id, leadId, user.id).catch(() => null),
          ),
        ),
      );
    }
    if (!aiAvailable) {
      runBackground(
        recordWorkflowAgentRun(supabase, agentContext, {
          agent_name: "Import Normalization Router",
          service_name: "lead_intelligence",
          model: "not_configured",
          input: { source: "imported", ai_available: false, row_count: payload.rows.length },
          structured_output_jsonb: {
            inserted: inserted.length,
            skipped,
            preserved_custom_fields: preservedCustomFieldCount,
            ai_analysis_status: analysisStatusForAI(false),
          },
          tier: ACTION_RISK_TIER.SILENT_INTERNAL,
          status: skipped > 0 ? "partial" : "success",
          created_by: user.id,
        }).catch(() => null),
      );
    }

    return jsonResponse(req, {
      ok: true,
      ai_available: aiAvailable,
      inserted: inserted.length,
      skipped,
      summary: {
        inserted: inserted.length,
        skipped,
        skipped_reasons: skippedReasons,
        preserved_custom_fields: preservedCustomFieldCount,
        scoring_queued: scoringQueued,
      },
    });
  } catch (error) {
    const { status, message } = safeError(error);
    return jsonResponse(req, { ok: false, error: message }, status);
  }
});
