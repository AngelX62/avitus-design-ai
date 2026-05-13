-- Standardize AI-ready lead analysis fields for no-key V1.
-- OpenAI remains server-side only; this migration only prepares durable fields.

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ai_summary text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ai_next_action text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ai_reply_draft text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ai_red_flags text[];
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ai_processed_at timestamptz;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ai_analysis_status text NOT NULL DEFAULT 'not_configured';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ai_analysis_error text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ai_model text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_scored_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS fit_score integer;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS classification text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS temperature text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS urgency text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS missing_info text[];
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS suggested_followup text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS score_breakdown jsonb;

ALTER TABLE public.leads
  ALTER COLUMN ai_analysis_status SET DEFAULT 'not_configured';

ALTER TABLE public.leads
  ALTER COLUMN score_breakdown DROP DEFAULT;

UPDATE public.leads
SET score_breakdown = NULL
WHERE fit_score IS NULL
  AND classification IS NULL
  AND temperature IS NULL
  AND score_breakdown = '{}'::jsonb
  AND ai_analysis_status IN ('not_configured', 'not_started');

ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_ai_analysis_status_allowed;

ALTER TABLE public.leads
  ADD CONSTRAINT leads_ai_analysis_status_allowed
  CHECK (ai_analysis_status IN ('not_configured', 'pending', 'complete', 'failed', 'not_started'))
  NOT VALID;

