ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS classification text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'leads_classification_allowed'
  ) THEN
    ALTER TABLE public.leads
      ADD CONSTRAINT leads_classification_allowed
      CHECK (
        classification IS NULL
        OR classification IN ('hot', 'warm', 'cold', 'not_fit', 'needs_review')
      ) NOT VALID;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS leads_studio_classification_idx
  ON public.leads(studio_id, classification);
