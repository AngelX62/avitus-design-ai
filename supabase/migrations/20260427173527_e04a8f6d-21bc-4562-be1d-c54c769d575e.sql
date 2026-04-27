
-- Roles enum
CREATE TYPE public.app_role AS ENUM ('owner', 'designer');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role security definer
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- is_studio_member: any signed in user with a role row
CREATE OR REPLACE FUNCTION public.is_studio_member(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id)
$$;

-- Studio settings (singleton)
CREATE TABLE public.studio_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_name TEXT NOT NULL DEFAULT 'Avitus',
  ideal_client TEXT,
  target_budget_min INTEGER,
  target_budget_max INTEGER,
  signature_styles TEXT[] DEFAULT '{}',
  intake_intro TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.studio_settings ENABLE ROW LEVEL SECURITY;

-- Leads
CREATE TYPE public.lead_status AS ENUM ('new', 'qualified', 'proposal', 'won', 'lost');

CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  project_type TEXT,
  rooms TEXT[],
  budget_range TEXT,
  timeline TEXT,
  location TEXT,
  brief TEXT,
  photo_url TEXT,
  source TEXT DEFAULT 'intake_form',
  status lead_status NOT NULL DEFAULT 'new',
  fit_score INTEGER,
  ai_summary TEXT,
  ai_next_action TEXT,
  ai_reply_draft TEXT,
  ai_red_flags TEXT[],
  ai_processed_at TIMESTAMPTZ,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Lead activities
CREATE TABLE public.lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  kind TEXT NOT NULL,
  body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

-- Projects
CREATE TYPE public.project_status AS ENUM ('concept', 'development', 'final', 'delivered');

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  client_name TEXT,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  status project_status NOT NULL DEFAULT 'concept',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Rooms
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Design generations
CREATE TABLE public.design_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  brief TEXT,
  style TEXT,
  palette TEXT[],
  budget_tier TEXT,
  variation_count INTEGER NOT NULL DEFAULT 2,
  room_photo_url TEXT,
  floor_plan_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
ALTER TABLE public.design_generations ENABLE ROW LEVEL SECURITY;

-- Design variations
CREATE TABLE public.design_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID NOT NULL REFERENCES public.design_generations(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  rationale TEXT,
  materials TEXT[],
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.design_variations ENABLE ROW LEVEL SECURITY;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_studio_settings_updated BEFORE UPDATE ON public.studio_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_leads_updated BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-create profile + first user becomes owner
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE user_count INT;
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), NEW.raw_user_meta_data->>'avatar_url');

  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  IF user_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'owner');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'designer');
  END IF;

  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed studio settings singleton
INSERT INTO public.studio_settings (studio_name, ideal_client, target_budget_min, target_budget_max, signature_styles, intake_intro)
VALUES ('Avitus', 'Discerning homeowners renovating their primary residence', 25000, 250000, ARRAY['Editorial Minimal','Japandi','Modern'], 'Tell us about your space — we craft considered interiors with AI as our quiet collaborator.');

-- ============ RLS POLICIES ============

-- profiles
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Studio members view all profiles" ON public.profiles FOR SELECT USING (public.is_studio_member(auth.uid()));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- user_roles
CREATE POLICY "Users view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owners view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Owners manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));

-- studio_settings
CREATE POLICY "Studio members read settings" ON public.studio_settings FOR SELECT USING (public.is_studio_member(auth.uid()));
CREATE POLICY "Owners update settings" ON public.studio_settings FOR UPDATE USING (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Owners insert settings" ON public.studio_settings FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'owner'));

-- leads: public can INSERT (intake form), studio members read/manage
CREATE POLICY "Anyone can submit a lead" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Studio reads leads" ON public.leads FOR SELECT USING (public.is_studio_member(auth.uid()));
CREATE POLICY "Studio updates leads" ON public.leads FOR UPDATE USING (public.is_studio_member(auth.uid()));
CREATE POLICY "Studio deletes leads" ON public.leads FOR DELETE USING (public.is_studio_member(auth.uid()));

-- lead_activities
CREATE POLICY "Studio reads activities" ON public.lead_activities FOR SELECT USING (public.is_studio_member(auth.uid()));
CREATE POLICY "Studio writes activities" ON public.lead_activities FOR INSERT WITH CHECK (public.is_studio_member(auth.uid()));
CREATE POLICY "Studio updates activities" ON public.lead_activities FOR UPDATE USING (public.is_studio_member(auth.uid()));
CREATE POLICY "Studio deletes activities" ON public.lead_activities FOR DELETE USING (public.is_studio_member(auth.uid()));

-- projects
CREATE POLICY "Studio reads projects" ON public.projects FOR SELECT USING (public.is_studio_member(auth.uid()));
CREATE POLICY "Studio writes projects" ON public.projects FOR INSERT WITH CHECK (public.is_studio_member(auth.uid()));
CREATE POLICY "Studio updates projects" ON public.projects FOR UPDATE USING (public.is_studio_member(auth.uid()));
CREATE POLICY "Studio deletes projects" ON public.projects FOR DELETE USING (public.is_studio_member(auth.uid()));

-- rooms
CREATE POLICY "Studio reads rooms" ON public.rooms FOR SELECT USING (public.is_studio_member(auth.uid()));
CREATE POLICY "Studio writes rooms" ON public.rooms FOR INSERT WITH CHECK (public.is_studio_member(auth.uid()));
CREATE POLICY "Studio updates rooms" ON public.rooms FOR UPDATE USING (public.is_studio_member(auth.uid()));
CREATE POLICY "Studio deletes rooms" ON public.rooms FOR DELETE USING (public.is_studio_member(auth.uid()));

-- design_generations
CREATE POLICY "Studio reads generations" ON public.design_generations FOR SELECT USING (public.is_studio_member(auth.uid()));
CREATE POLICY "Studio writes generations" ON public.design_generations FOR INSERT WITH CHECK (public.is_studio_member(auth.uid()));
CREATE POLICY "Studio updates generations" ON public.design_generations FOR UPDATE USING (public.is_studio_member(auth.uid()));
CREATE POLICY "Studio deletes generations" ON public.design_generations FOR DELETE USING (public.is_studio_member(auth.uid()));

-- design_variations
CREATE POLICY "Studio reads variations" ON public.design_variations FOR SELECT USING (public.is_studio_member(auth.uid()));
CREATE POLICY "Studio writes variations" ON public.design_variations FOR INSERT WITH CHECK (public.is_studio_member(auth.uid()));
CREATE POLICY "Studio updates variations" ON public.design_variations FOR UPDATE USING (public.is_studio_member(auth.uid()));
CREATE POLICY "Studio deletes variations" ON public.design_variations FOR DELETE USING (public.is_studio_member(auth.uid()));

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('design-inputs', 'design-inputs', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('design-outputs', 'design-outputs', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('lead-uploads', 'lead-uploads', true);

-- Storage policies
CREATE POLICY "Public read design-inputs" ON storage.objects FOR SELECT USING (bucket_id = 'design-inputs');
CREATE POLICY "Studio writes design-inputs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'design-inputs' AND public.is_studio_member(auth.uid()));

CREATE POLICY "Public read design-outputs" ON storage.objects FOR SELECT USING (bucket_id = 'design-outputs');
CREATE POLICY "Studio writes design-outputs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'design-outputs' AND public.is_studio_member(auth.uid()));

CREATE POLICY "Public read lead-uploads" ON storage.objects FOR SELECT USING (bucket_id = 'lead-uploads');
CREATE POLICY "Anyone uploads lead-uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'lead-uploads');
