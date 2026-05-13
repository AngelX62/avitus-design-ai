import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { scoreLeadRequestSchema } from "../_shared/leadSchemas.ts";
import { adminClient, requireStudioMember, requireUser, safeError } from "../_shared/security.ts";
import { scoreLeadRecord } from "../_shared/scoring.ts";

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  try {
    const payload = scoreLeadRequestSchema.parse(await req.json());
    const user = await requireUser(req);
    const supabase = adminClient();
    await requireStudioMember(supabase, payload.studio_id, user.id);

    const analysis = await scoreLeadRecord(supabase, payload.studio_id, payload.lead_id, user.id);
    if ("ai_available" in analysis && analysis.ai_available === false) {
      return jsonResponse(req, { ok: true, ai_available: false, status: analysis.status, analysis });
    }

    return jsonResponse(req, { ok: true, ai_available: true, analysis });
  } catch (error) {
    const { status, message } = safeError(error);
    return jsonResponse(req, { ok: false, error: message }, status);
  }
});
