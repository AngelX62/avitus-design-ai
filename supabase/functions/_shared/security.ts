import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const adminClient = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

export const userClient = (req: Request) =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
    {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
      auth: { persistSession: false },
    },
  );

export const requireUser = async (req: Request) => {
  const supabase = userClient(req);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new HttpError(401, "Authentication required");
  return data.user;
};

export const requireStudioMember = async (
  supabase: ReturnType<typeof adminClient>,
  studioId: string,
  userId: string,
) => {
  const { data, error } = await supabase
    .from("studio_memberships")
    .select("role")
    .eq("studio_id", studioId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new HttpError(500, "Could not verify studio access");
  if (!data) throw new HttpError(403, "Studio access required");
  return data.role as "owner" | "designer";
};

export const requireStudioOwner = async (
  supabase: ReturnType<typeof adminClient>,
  studioId: string,
  userId: string,
) => {
  const role = await requireStudioMember(supabase, studioId, userId);
  if (role !== "owner") throw new HttpError(403, "Owner access required");
  return role;
};

export const safeError = (error: unknown) => {
  if (error instanceof HttpError) return { status: error.status, message: error.message };
  if (error instanceof Error) return { status: 500, message: error.message };
  return { status: 500, message: "Unknown error" };
};

export const hashToken = async (token: string) => {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

export const clampText = (value: unknown, max = 1000) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (!text) return null;
  return text.slice(0, max);
};

export const runBackground = (promise: Promise<unknown>) => {
  const edgeRuntime = (globalThis as unknown as { EdgeRuntime?: { waitUntil?: (p: Promise<unknown>) => void } }).EdgeRuntime;
  if (edgeRuntime?.waitUntil) edgeRuntime.waitUntil(promise);
  else void promise;
};
