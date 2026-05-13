ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_ai_analysis_status_allowed;

ALTER TABLE public.leads
  ADD CONSTRAINT leads_ai_analysis_status_allowed
  CHECK (ai_analysis_status IN ('not_started', 'pending', 'complete', 'failed', 'not_configured'))
  NOT VALID;
