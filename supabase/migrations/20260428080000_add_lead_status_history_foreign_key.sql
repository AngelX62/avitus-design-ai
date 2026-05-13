DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'lead_status_history_lead_id_fkey'
      AND conrelid = 'public.lead_status_history'::regclass
  ) THEN
    ALTER TABLE public.lead_status_history
      ADD CONSTRAINT lead_status_history_lead_id_fkey
      FOREIGN KEY (lead_id)
      REFERENCES public.leads(id)
      ON DELETE CASCADE;
  END IF;
END $$;
