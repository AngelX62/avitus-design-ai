import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { adminClient, hashToken, requireStudioOwner, requireUser, safeError } from "../_shared/security.ts";
import { z } from "https://esm.sh/zod@3.25.76";

const inviteSchema = z.object({
  studio_id: z.string().uuid(),
  email: z.string().trim().email().max(320),
  role: z.enum(["owner", "designer"]).default("designer"),
});

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  try {
    const payload = inviteSchema.parse(await req.json());
    const user = await requireUser(req);
    const supabase = adminClient();
    await requireStudioOwner(supabase, payload.studio_id, user.id);

    const token = crypto.randomUUID() + crypto.randomUUID();
    const tokenHash = await hashToken(token);
    const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();

    const { error } = await supabase.from("studio_invites").insert({
      studio_id: payload.studio_id,
      email: payload.email.toLowerCase(),
      role: payload.role,
      token_hash: tokenHash,
      invited_by: user.id,
      expires_at: expiresAt,
    });
    if (error) throw error;

    return jsonResponse(req, {
      ok: true,
      token,
      invite_url: `${req.headers.get("Origin") || ""}/invite/${token}`,
      expires_at: expiresAt,
    });
  } catch (error) {
    const { status, message } = safeError(error);
    return jsonResponse(req, { ok: false, error: message }, status);
  }
});
