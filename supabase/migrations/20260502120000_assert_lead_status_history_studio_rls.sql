-- Defensively re-asserts the studio-scoped RLS policies for lead_status_history.
--
-- The original creation in 20260428024624 used the legacy is_studio_member(auth.uid())
-- single-arg form, which only checks "is the caller a member of any studio?". The
-- foundation migration 20260428090000 dropped that legacy function CASCADE and
-- recreated the policies with the correct two-arg form is_studio_member(studio_id).
-- This migration re-asserts that correct state idempotently so the invariant cannot
-- silently regress if the foundation migration is ever modified or rolled back.
--
-- Idempotent on any environment that already ran 20260428090000.

DROP POLICY IF EXISTS "Studio reads status history" ON public.lead_status_history;
CREATE POLICY "Studio reads status history" ON public.lead_status_history
  FOR SELECT USING (public.is_studio_member(studio_id));

DROP POLICY IF EXISTS "Studio writes status history" ON public.lead_status_history;
CREATE POLICY "Studio writes status history" ON public.lead_status_history
  FOR INSERT WITH CHECK (public.is_studio_member(studio_id));
