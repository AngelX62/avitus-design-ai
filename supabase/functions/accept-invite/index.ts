import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { adminClient, hashToken, requireUser, safeError } from "../_shared/security.ts";
import { z } from "https://esm.sh/zod@3.25.76";

const acceptSchema = z.object({
  token: z.string().trim().min(20).max(120),
});

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  try {
    const payload = acceptSchema.parse(await req.json());
    const user = await requireUser(req);
    const supabase = adminClient();
    const tokenHash = await hashToken(payload.token);

    const { data: invite, error } = await supabase
      .from("studio_invites")
      .select("id, studio_id, email, role, expires_at, accepted_at")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (error) throw error;
    if (!invite || invite.accepted_at) return jsonResponse(req, { ok: false, error: "Invite not found" }, 404);
    if (new Date(invite.expires_at).getTime() < Date.now()) {
      return jsonResponse(req, { ok: false, error: "Invite expired" }, 410);
    }
    if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
      return jsonResponse(req, { ok: false, error: "Sign in with the invited email address" }, 403);
    }

    const { error: membershipError } = await supabase.from("studio_memberships").upsert({
      studio_id: invite.studio_id,
      user_id: user.id,
      role: invite.role,
    });
    if (membershipError) throw membershipError;

    const { error: inviteError } = await supabase
      .from("studio_invites")
      .update({ accepted_at: new Date().toISOString(), accepted_by: user.id })
      .eq("id", invite.id);
    if (inviteError) throw inviteError;

    return jsonResponse(req, { ok: true, studio_id: invite.studio_id });
  } catch (error) {
    const { status, message } = safeError(error);
    return jsonResponse(req, { ok: false, error: message }, status);
  }
});
