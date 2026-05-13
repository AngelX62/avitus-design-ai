-- Avitus v1 multi-studio foundation.
-- Additive migration: preserves existing single-studio data under the default "avitus" studio.

CREATE TABLE IF NOT EXISTS public.studios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.studios ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.studio_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'designer',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (studio_id, user_id)
);
ALTER TABLE public.studio_memberships ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.studio_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.app_role NOT NULL DEFAULT 'designer',
  token_hash text NOT NULL UNIQUE,
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.studio_invites ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_studios_updated
  BEFORE UPDATE ON public.studios
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.studios (name, slug)
VALUES ('Avitus', 'avitus')
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE public.studio_settings ADD COLUMN IF NOT EXISTS studio_id uuid;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS studio_id uuid;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS imported_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ai_analysis_status text NOT NULL DEFAULT 'not_started';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ai_analysis_error text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ai_model text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_scored_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.lead_activities ADD COLUMN IF NOT EXISTS studio_id uuid;
ALTER TABLE public.lead_status_history ADD COLUMN IF NOT EXISTS studio_id uuid;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS studio_id uuid;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS studio_id uuid;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.design_generations ADD COLUMN IF NOT EXISTS studio_id uuid;
ALTER TABLE public.design_variations ADD COLUMN IF NOT EXISTS studio_id uuid;

DO $$
DECLARE default_studio_id uuid;
BEGIN
  SELECT id INTO default_studio_id FROM public.studios WHERE slug = 'avitus';

  UPDATE public.studio_settings SET studio_id = default_studio_id WHERE studio_id IS NULL;
  UPDATE public.leads SET studio_id = default_studio_id WHERE studio_id IS NULL;
  UPDATE public.projects SET studio_id = COALESCE((SELECT l.studio_id FROM public.leads l WHERE l.id = projects.lead_id), default_studio_id) WHERE studio_id IS NULL;
  UPDATE public.rooms SET studio_id = COALESCE((SELECT p.studio_id FROM public.projects p WHERE p.id = rooms.project_id), default_studio_id) WHERE studio_id IS NULL;
  UPDATE public.lead_activities SET studio_id = COALESCE((SELECT l.studio_id FROM public.leads l WHERE l.id = lead_activities.lead_id), default_studio_id) WHERE studio_id IS NULL;
  UPDATE public.lead_status_history SET studio_id = COALESCE((SELECT l.studio_id FROM public.leads l WHERE l.id = lead_status_history.lead_id), default_studio_id) WHERE studio_id IS NULL;
  UPDATE public.design_generations SET studio_id = COALESCE((SELECT p.studio_id FROM public.projects p WHERE p.id = design_generations.project_id), default_studio_id) WHERE studio_id IS NULL;
  UPDATE public.design_variations SET studio_id = COALESCE((SELECT dg.studio_id FROM public.design_generations dg WHERE dg.id = design_variations.generation_id), default_studio_id) WHERE studio_id IS NULL;

  INSERT INTO public.studio_memberships (studio_id, user_id, role)
  SELECT default_studio_id, user_id, role
  FROM public.user_roles
  ON CONFLICT (studio_id, user_id) DO UPDATE SET role = EXCLUDED.role;
END $$;

ALTER TABLE public.studio_settings ALTER COLUMN studio_id SET NOT NULL;
ALTER TABLE public.leads ALTER COLUMN studio_id SET NOT NULL;
ALTER TABLE public.lead_activities ALTER COLUMN studio_id SET NOT NULL;
ALTER TABLE public.lead_status_history ALTER COLUMN studio_id SET NOT NULL;
ALTER TABLE public.projects ALTER COLUMN studio_id SET NOT NULL;
ALTER TABLE public.rooms ALTER COLUMN studio_id SET NOT NULL;
ALTER TABLE public.design_generations ALTER COLUMN studio_id SET NOT NULL;
ALTER TABLE public.design_variations ALTER COLUMN studio_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'studio_settings_studio_id_fkey') THEN
    ALTER TABLE public.studio_settings ADD CONSTRAINT studio_settings_studio_id_fkey FOREIGN KEY (studio_id) REFERENCES public.studios(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_studio_id_fkey') THEN
    ALTER TABLE public.leads ADD CONSTRAINT leads_studio_id_fkey FOREIGN KEY (studio_id) REFERENCES public.studios(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lead_activities_studio_id_fkey') THEN
    ALTER TABLE public.lead_activities ADD CONSTRAINT lead_activities_studio_id_fkey FOREIGN KEY (studio_id) REFERENCES public.studios(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lead_status_history_studio_id_fkey') THEN
    ALTER TABLE public.lead_status_history ADD CONSTRAINT lead_status_history_studio_id_fkey FOREIGN KEY (studio_id) REFERENCES public.studios(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_studio_id_fkey') THEN
    ALTER TABLE public.projects ADD CONSTRAINT projects_studio_id_fkey FOREIGN KEY (studio_id) REFERENCES public.studios(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rooms_studio_id_fkey') THEN
    ALTER TABLE public.rooms ADD CONSTRAINT rooms_studio_id_fkey FOREIGN KEY (studio_id) REFERENCES public.studios(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'design_generations_studio_id_fkey') THEN
    ALTER TABLE public.design_generations ADD CONSTRAINT design_generations_studio_id_fkey FOREIGN KEY (studio_id) REFERENCES public.studios(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'design_variations_studio_id_fkey') THEN
    ALTER TABLE public.design_variations ADD CONSTRAINT design_variations_studio_id_fkey FOREIGN KEY (studio_id) REFERENCES public.studios(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS studio_settings_studio_id_key ON public.studio_settings(studio_id);
CREATE INDEX IF NOT EXISTS studio_memberships_user_idx ON public.studio_memberships(user_id);
CREATE INDEX IF NOT EXISTS studio_invites_email_idx ON public.studio_invites(lower(email), accepted_at);
CREATE INDEX IF NOT EXISTS leads_studio_status_idx ON public.leads(studio_id, status);
CREATE INDEX IF NOT EXISTS leads_studio_created_idx ON public.leads(studio_id, created_at DESC);
CREATE INDEX IF NOT EXISTS leads_studio_temperature_idx ON public.leads(studio_id, temperature);
CREATE INDEX IF NOT EXISTS leads_studio_reminder_idx ON public.leads(studio_id, reminder_at);
CREATE INDEX IF NOT EXISTS projects_studio_created_idx ON public.projects(studio_id, created_at DESC);
CREATE INDEX IF NOT EXISTS rooms_studio_project_idx ON public.rooms(studio_id, project_id);
CREATE INDEX IF NOT EXISTS lead_activities_studio_lead_idx ON public.lead_activities(studio_id, lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS lead_status_history_studio_lead_idx ON public.lead_status_history(studio_id, lead_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS design_variations_studio_generation_idx ON public.design_variations(studio_id, generation_id);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_fit_score_range') THEN
    ALTER TABLE public.leads ADD CONSTRAINT leads_fit_score_range CHECK (fit_score IS NULL OR (fit_score >= 0 AND fit_score <= 100)) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_temperature_allowed') THEN
    ALTER TABLE public.leads ADD CONSTRAINT leads_temperature_allowed CHECK (temperature IS NULL OR temperature IN ('hot', 'warm', 'cold')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_urgency_allowed') THEN
    ALTER TABLE public.leads ADD CONSTRAINT leads_urgency_allowed CHECK (urgency IS NULL OR urgency IN ('low', 'medium', 'high')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_ai_analysis_status_allowed') THEN
    ALTER TABLE public.leads ADD CONSTRAINT leads_ai_analysis_status_allowed CHECK (ai_analysis_status IN ('not_started', 'pending', 'complete', 'failed')) NOT VALID;
  END IF;
END $$;

-- Drop the legacy single-arg is_studio_member(uuid) before introducing the new
-- two-arg overload below. Without this, calls like is_studio_member(studio_id)
-- match both signatures (the two-arg form via its default) and Postgres raises
-- 42725 ambiguous_function. CASCADE clears dependent policies; storage policies
-- are recreated at the end of this migration against is_any_studio_member.
DROP FUNCTION IF EXISTS public.is_studio_member(uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.is_studio_member(_studio_id uuid, _user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.studio_memberships
    WHERE studio_id = _studio_id
      AND user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.has_studio_role(_studio_id uuid, _role public.app_role, _user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.studio_memberships
    WHERE studio_id = _studio_id
      AND user_id = _user_id
      AND role = _role
  )
$$;

-- "Any studio" membership check, used by cross-studio resources like shared
-- storage buckets. Distinct from is_studio_member(studio_id, user_id), which
-- asks whether a user belongs to one specific studio.
CREATE OR REPLACE FUNCTION public.is_any_studio_member(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.studio_memberships WHERE user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.studio_memberships WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.get_public_studio(_slug text)
RETURNS TABLE(studio_id uuid, studio_name text, slug text, intake_intro text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.name, s.slug, ss.intake_intro
  FROM public.studios s
  LEFT JOIN public.studio_settings ss ON ss.studio_id = s.id
  WHERE s.slug = lower(trim(_slug))
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_lead_child_studio()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT studio_id INTO NEW.studio_id
  FROM public.leads
  WHERE id = NEW.lead_id;

  IF NEW.studio_id IS NULL THEN
    RAISE EXCEPTION 'lead_id does not belong to a studio';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lead_activities_studio ON public.lead_activities;
CREATE TRIGGER trg_lead_activities_studio
  BEFORE INSERT OR UPDATE OF lead_id ON public.lead_activities
  FOR EACH ROW EXECUTE FUNCTION public.sync_lead_child_studio();

DROP TRIGGER IF EXISTS trg_lead_status_history_studio ON public.lead_status_history;
CREATE TRIGGER trg_lead_status_history_studio
  BEFORE INSERT OR UPDATE OF lead_id ON public.lead_status_history
  FOR EACH ROW EXECUTE FUNCTION public.sync_lead_child_studio();

CREATE OR REPLACE FUNCTION public.sync_room_studio()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT studio_id INTO NEW.studio_id
  FROM public.projects
  WHERE id = NEW.project_id;

  IF NEW.studio_id IS NULL THEN
    RAISE EXCEPTION 'project_id does not belong to a studio';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rooms_studio ON public.rooms;
CREATE TRIGGER trg_rooms_studio
  BEFORE INSERT OR UPDATE OF project_id ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.sync_room_studio();

CREATE OR REPLACE FUNCTION public.sync_design_variation_studio()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT studio_id INTO NEW.studio_id
  FROM public.design_generations
  WHERE id = NEW.generation_id;

  IF NEW.studio_id IS NULL THEN
    RAISE EXCEPTION 'generation_id does not belong to a studio';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_design_variations_studio ON public.design_variations;
CREATE TRIGGER trg_design_variations_studio
  BEFORE INSERT OR UPDATE OF generation_id ON public.design_variations
  FOR EACH ROW EXECUTE FUNCTION public.sync_design_variation_studio();

CREATE OR REPLACE FUNCTION public.handle_lead_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.lead_status_history (studio_id, lead_id, from_status, to_status, changed_by)
    VALUES (NEW.studio_id, NEW.id, OLD.status::text, NEW.status::text, auth.uid());

    IF NEW.status::text = 'won'
      AND OLD.status::text <> 'won'
      AND NOT EXISTS (SELECT 1 FROM public.projects WHERE lead_id = NEW.id)
    THEN
      INSERT INTO public.projects (studio_id, name, client_name, lead_id, status, description, created_by)
      VALUES (
        NEW.studio_id,
        COALESCE(NEW.full_name, 'New project') ||
          CASE WHEN NEW.project_type IS NOT NULL THEN ' - ' || NEW.project_type ELSE '' END,
        NEW.full_name,
        NEW.id,
        'concept',
        NEW.ai_summary,
        auth.uid()
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Policies: replace broad membership rules with studio-scoped checks.
DROP POLICY IF EXISTS "Studio members view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Owners view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Owners manage roles" ON public.user_roles;

DROP POLICY IF EXISTS "Studio members read settings" ON public.studio_settings;
DROP POLICY IF EXISTS "Owners update settings" ON public.studio_settings;
DROP POLICY IF EXISTS "Owners insert settings" ON public.studio_settings;
CREATE POLICY "Studio members read settings" ON public.studio_settings FOR SELECT USING (public.is_studio_member(studio_id));
CREATE POLICY "Owners update settings" ON public.studio_settings FOR UPDATE USING (public.has_studio_role(studio_id, 'owner')) WITH CHECK (public.has_studio_role(studio_id, 'owner'));
CREATE POLICY "Owners insert settings" ON public.studio_settings FOR INSERT WITH CHECK (public.has_studio_role(studio_id, 'owner'));

DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.leads;
DROP POLICY IF EXISTS "Studio reads leads" ON public.leads;
DROP POLICY IF EXISTS "Studio updates leads" ON public.leads;
DROP POLICY IF EXISTS "Studio deletes leads" ON public.leads;
CREATE POLICY "Anyone can submit a lead" ON public.leads
  FOR INSERT WITH CHECK (studio_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.studios s WHERE s.id = studio_id));
CREATE POLICY "Studio reads leads" ON public.leads FOR SELECT USING (public.is_studio_member(studio_id));
CREATE POLICY "Studio updates leads" ON public.leads FOR UPDATE USING (public.is_studio_member(studio_id)) WITH CHECK (public.is_studio_member(studio_id));
CREATE POLICY "Studio deletes leads" ON public.leads FOR DELETE USING (public.has_studio_role(studio_id, 'owner'));

DROP POLICY IF EXISTS "Studio reads activities" ON public.lead_activities;
DROP POLICY IF EXISTS "Studio writes activities" ON public.lead_activities;
DROP POLICY IF EXISTS "Studio updates activities" ON public.lead_activities;
DROP POLICY IF EXISTS "Studio deletes activities" ON public.lead_activities;
CREATE POLICY "Studio reads activities" ON public.lead_activities FOR SELECT USING (public.is_studio_member(studio_id));
CREATE POLICY "Studio writes activities" ON public.lead_activities FOR INSERT WITH CHECK (public.is_studio_member(studio_id));
CREATE POLICY "Studio updates activities" ON public.lead_activities FOR UPDATE USING (public.is_studio_member(studio_id)) WITH CHECK (public.is_studio_member(studio_id));
CREATE POLICY "Studio deletes activities" ON public.lead_activities FOR DELETE USING (public.has_studio_role(studio_id, 'owner'));

DROP POLICY IF EXISTS "Studio reads status history" ON public.lead_status_history;
DROP POLICY IF EXISTS "Studio writes status history" ON public.lead_status_history;
CREATE POLICY "Studio reads status history" ON public.lead_status_history FOR SELECT USING (public.is_studio_member(studio_id));
CREATE POLICY "Studio writes status history" ON public.lead_status_history FOR INSERT WITH CHECK (public.is_studio_member(studio_id));

DROP POLICY IF EXISTS "Studio reads projects" ON public.projects;
DROP POLICY IF EXISTS "Studio writes projects" ON public.projects;
DROP POLICY IF EXISTS "Studio updates projects" ON public.projects;
DROP POLICY IF EXISTS "Studio deletes projects" ON public.projects;
CREATE POLICY "Studio reads projects" ON public.projects FOR SELECT USING (public.is_studio_member(studio_id));
CREATE POLICY "Studio writes projects" ON public.projects FOR INSERT WITH CHECK (public.is_studio_member(studio_id));
CREATE POLICY "Studio updates projects" ON public.projects FOR UPDATE USING (public.is_studio_member(studio_id)) WITH CHECK (public.is_studio_member(studio_id));
CREATE POLICY "Studio deletes projects" ON public.projects FOR DELETE USING (public.has_studio_role(studio_id, 'owner'));

DROP POLICY IF EXISTS "Studio reads rooms" ON public.rooms;
DROP POLICY IF EXISTS "Studio writes rooms" ON public.rooms;
DROP POLICY IF EXISTS "Studio updates rooms" ON public.rooms;
DROP POLICY IF EXISTS "Studio deletes rooms" ON public.rooms;
CREATE POLICY "Studio reads rooms" ON public.rooms FOR SELECT USING (public.is_studio_member(studio_id));
CREATE POLICY "Studio writes rooms" ON public.rooms FOR INSERT WITH CHECK (public.is_studio_member(studio_id));
CREATE POLICY "Studio updates rooms" ON public.rooms FOR UPDATE USING (public.is_studio_member(studio_id)) WITH CHECK (public.is_studio_member(studio_id));
CREATE POLICY "Studio deletes rooms" ON public.rooms FOR DELETE USING (public.has_studio_role(studio_id, 'owner'));

DROP POLICY IF EXISTS "Studio reads generations" ON public.design_generations;
DROP POLICY IF EXISTS "Studio writes generations" ON public.design_generations;
DROP POLICY IF EXISTS "Studio updates generations" ON public.design_generations;
DROP POLICY IF EXISTS "Studio deletes generations" ON public.design_generations;
CREATE POLICY "Studio reads generations" ON public.design_generations FOR SELECT USING (public.is_studio_member(studio_id));
CREATE POLICY "Studio writes generations" ON public.design_generations FOR INSERT WITH CHECK (public.is_studio_member(studio_id));
CREATE POLICY "Studio updates generations" ON public.design_generations FOR UPDATE USING (public.is_studio_member(studio_id)) WITH CHECK (public.is_studio_member(studio_id));
CREATE POLICY "Studio deletes generations" ON public.design_generations FOR DELETE USING (public.has_studio_role(studio_id, 'owner'));

DROP POLICY IF EXISTS "Studio reads variations" ON public.design_variations;
DROP POLICY IF EXISTS "Studio writes variations" ON public.design_variations;
DROP POLICY IF EXISTS "Studio updates variations" ON public.design_variations;
DROP POLICY IF EXISTS "Studio deletes variations" ON public.design_variations;
CREATE POLICY "Studio reads variations" ON public.design_variations FOR SELECT USING (public.is_studio_member(studio_id));
CREATE POLICY "Studio writes variations" ON public.design_variations FOR INSERT WITH CHECK (public.is_studio_member(studio_id));
CREATE POLICY "Studio updates variations" ON public.design_variations FOR UPDATE USING (public.is_studio_member(studio_id)) WITH CHECK (public.is_studio_member(studio_id));
CREATE POLICY "Studio deletes variations" ON public.design_variations FOR DELETE USING (public.has_studio_role(studio_id, 'owner'));

DROP POLICY IF EXISTS "Studio reads studios" ON public.studios;
DROP POLICY IF EXISTS "Members read own studios" ON public.studios;
CREATE POLICY "Members read own studios" ON public.studios FOR SELECT USING (public.is_studio_member(id));

DROP POLICY IF EXISTS "Users read memberships" ON public.studio_memberships;
DROP POLICY IF EXISTS "Owners manage memberships" ON public.studio_memberships;
CREATE POLICY "Users read memberships" ON public.studio_memberships
  FOR SELECT USING (user_id = auth.uid() OR public.is_studio_member(studio_id));
CREATE POLICY "Owners manage memberships" ON public.studio_memberships
  FOR ALL USING (public.has_studio_role(studio_id, 'owner')) WITH CHECK (public.has_studio_role(studio_id, 'owner'));

DROP POLICY IF EXISTS "Owners read invites" ON public.studio_invites;
DROP POLICY IF EXISTS "Owners manage invites" ON public.studio_invites;
CREATE POLICY "Owners read invites" ON public.studio_invites FOR SELECT USING (public.has_studio_role(studio_id, 'owner'));
CREATE POLICY "Owners manage invites" ON public.studio_invites
  FOR ALL USING (public.has_studio_role(studio_id, 'owner')) WITH CHECK (public.has_studio_role(studio_id, 'owner'));

-- Recreate cross-studio storage policies that the CASCADE drop above removed.
DROP POLICY IF EXISTS "Studio writes design-inputs" ON storage.objects;
DROP POLICY IF EXISTS "Studio writes design-outputs" ON storage.objects;
CREATE POLICY "Studio writes design-inputs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'design-inputs' AND public.is_any_studio_member(auth.uid()));
CREATE POLICY "Studio writes design-outputs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'design-outputs' AND public.is_any_studio_member(auth.uid()));
