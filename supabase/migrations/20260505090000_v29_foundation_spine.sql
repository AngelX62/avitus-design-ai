-- Avitus v2.9 foundation spine.
-- Adds tenant-scoped agent run observability for no-key V1 and future AI calls.

CREATE TABLE IF NOT EXISTS public.agent_runs (
  run_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  agent_name text NOT NULL,
  service_name text NOT NULL,
  model text,
  prompt_pack_version text NOT NULL DEFAULT 'v1.0-no-key',
  schema_version text NOT NULL DEFAULT 'lead-analysis-v1',
  input_hash text,
  structured_output_jsonb jsonb NOT NULL DEFAULT '{}'::jsonb,
  raw_text text,
  tier smallint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'success',
  confidence numeric,
  latency_ms integer NOT NULL DEFAULT 0,
  prompt_tokens integer NOT NULL DEFAULT 0,
  completion_tokens integer NOT NULL DEFAULT 0,
  cost_usd numeric(12,6) NOT NULL DEFAULT 0,
  human_correction_jsonb jsonb,
  corrected_at timestamptz,
  corrected_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_runs_tier_allowed') THEN
    ALTER TABLE public.agent_runs
      ADD CONSTRAINT agent_runs_tier_allowed CHECK (tier IN (0, 1, 2, 3, 4));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_runs_status_allowed') THEN
    ALTER TABLE public.agent_runs
      ADD CONSTRAINT agent_runs_status_allowed CHECK (status IN ('success', 'partial', 'failed'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_runs_service_name_allowed') THEN
    ALTER TABLE public.agent_runs
      ADD CONSTRAINT agent_runs_service_name_allowed CHECK (
        service_name IN (
          'lead_intelligence',
          'communication_drafting',
          'pipeline_signals',
          'reporting',
          'integration_payloads'
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS agent_runs_studio_created_idx ON public.agent_runs(studio_id, created_at DESC);
CREATE INDEX IF NOT EXISTS agent_runs_studio_lead_idx ON public.agent_runs(studio_id, lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS agent_runs_prompt_pack_idx ON public.agent_runs(studio_id, prompt_pack_version, created_at DESC);
CREATE INDEX IF NOT EXISTS agent_runs_status_idx ON public.agent_runs(studio_id, status, created_at DESC);

DROP POLICY IF EXISTS "Studio reads agent runs" ON public.agent_runs;
CREATE POLICY "Studio reads agent runs" ON public.agent_runs
  FOR SELECT USING (public.is_studio_member(studio_id));

-- Writes are intentionally reserved for trusted backend/orchestrator paths.
-- No direct authenticated INSERT/UPDATE/DELETE policies are created in V1.0.
