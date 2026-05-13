DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.leads;
DROP POLICY IF EXISTS "Studio members insert leads" ON public.leads;

CREATE POLICY "Studio members insert leads" ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (public.is_studio_member(studio_id));
