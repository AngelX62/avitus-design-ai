ALTER TABLE public.studio_settings
  ADD COLUMN IF NOT EXISTS business_type text,
  ADD COLUMN IF NOT EXISTS intake_thank_you_message text;

DROP FUNCTION IF EXISTS public.get_public_studio(text);

CREATE OR REPLACE FUNCTION public.get_public_studio(_slug text)
RETURNS TABLE(
  studio_id uuid,
  studio_name text,
  slug text,
  intake_intro text,
  intake_thank_you_message text,
  currency text,
  preferred_project_types text[],
  preferred_locations text[],
  target_budget_min integer,
  target_budget_max integer,
  business_type text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id,
    COALESCE(NULLIF(ss.studio_name, ''), s.name),
    s.slug,
    ss.intake_intro,
    ss.intake_thank_you_message,
    COALESCE(ss.currency, 'USD'),
    COALESCE(ss.preferred_project_types, '{}'::text[]),
    COALESCE(ss.preferred_locations, '{}'::text[]),
    ss.target_budget_min,
    ss.target_budget_max,
    ss.business_type
  FROM public.studios s
  LEFT JOIN public.studio_settings ss ON ss.studio_id = s.id
  WHERE s.slug = lower(trim(_slug))
  LIMIT 1
$$;
