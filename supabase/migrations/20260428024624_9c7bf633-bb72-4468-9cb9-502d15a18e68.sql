
-- 1. Extend leads table
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS property_type text,
  ADD COLUMN IF NOT EXISTS style_preference text,
  ADD COLUMN IF NOT EXISTS urgency text,
  ADD COLUMN IF NOT EXISTS temperature text,
  ADD COLUMN IF NOT EXISTS missing_info text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS suggested_followup text,
  ADD COLUMN IF NOT EXISTS score_breakdown jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS raw_inquiry text,
  ADD COLUMN IF NOT EXISTS custom_fields jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_contacted_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_at timestamptz;

-- 2. Add new statuses to lead_status enum
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'needs_review';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'high_fit';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'contacted';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'consultation_booked';

-- 3. Extend studio_settings
ALTER TABLE public.studio_settings
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS preferred_project_types text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS preferred_locations text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS low_fit_signs text,
  ADD COLUMN IF NOT EXISTS followup_tone text NOT NULL DEFAULT 'warm';

-- 4. Lead status history
CREATE TABLE IF NOT EXISTS public.lead_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  from_status text,
  to_status text NOT NULL,
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lead_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Studio reads status history" ON public.lead_status_history;
CREATE POLICY "Studio reads status history" ON public.lead_status_history
  FOR SELECT USING (public.is_studio_member(auth.uid()));

DROP POLICY IF EXISTS "Studio writes status history" ON public.lead_status_history;
CREATE POLICY "Studio writes status history" ON public.lead_status_history
  FOR INSERT WITH CHECK (public.is_studio_member(auth.uid()));

CREATE INDEX IF NOT EXISTS lead_status_history_lead_id_idx
  ON public.lead_status_history(lead_id, changed_at DESC);

-- 5. Trigger: log status changes + auto-create project on won
CREATE OR REPLACE FUNCTION public.handle_lead_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.lead_status_history (lead_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.status::text, NEW.status::text, auth.uid());

    IF NEW.status::text = 'won' AND OLD.status::text <> 'won' THEN
      INSERT INTO public.projects (name, client_name, lead_id, status, description)
      VALUES (
        COALESCE(NEW.full_name, 'New project') ||
          CASE WHEN NEW.project_type IS NOT NULL THEN ' — ' || NEW.project_type ELSE '' END,
        NEW.full_name,
        NEW.id,
        'concept',
        NEW.ai_summary
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS leads_status_change ON public.leads;
CREATE TRIGGER leads_status_change
  AFTER UPDATE OF status ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_lead_status_change();

-- 6. Backfill defaults
UPDATE public.studio_settings SET currency = COALESCE(currency, 'USD'), followup_tone = COALESCE(followup_tone, 'warm');
