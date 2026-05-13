export type PublicIntakeSafetyPayload = {
  studio_id?: unknown;
  studio_slug?: unknown;
  website?: unknown;
};

const hasText = (value: unknown) => typeof value === "string" && value.trim().length > 0;

export const hasDirectStudioId = (payload: PublicIntakeSafetyPayload) => hasText(payload.studio_id);

export const isHoneypotFilled = (payload: PublicIntakeSafetyPayload) => hasText(payload.website);

export const hasPublicStudioSlug = (payload: PublicIntakeSafetyPayload) => hasText(payload.studio_slug);

export const validatePublicIntakeSafety = (payload: PublicIntakeSafetyPayload) => {
  if (hasDirectStudioId(payload)) return { ok: false as const, status: 400, error: "Public intake must use a studio link" };
  if (isHoneypotFilled(payload)) return { ok: true as const, ignored: true as const };
  if (!hasPublicStudioSlug(payload)) return { ok: false as const, status: 400, error: "Valid studio link required" };
  return { ok: true as const, ignored: false as const };
};
