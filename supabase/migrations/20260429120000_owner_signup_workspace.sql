-- Create an owner studio workspace when a new owner signs up with studio_name metadata.
-- Invite signups omit studio_name and continue to join an existing studio through the invite flow.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_studio_name text;
  base_slug text;
  final_slug text;
  suffix integer := 0;
  new_studio_id uuid;
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  requested_studio_name := NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'studio_name', '')), '');

  IF requested_studio_name IS NOT NULL THEN
    base_slug := lower(regexp_replace(requested_studio_name, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);

    IF base_slug = '' THEN
      base_slug := 'studio';
    END IF;

    base_slug := left(base_slug, 48);

    LOOP
      final_slug := CASE
        WHEN suffix = 0 THEN base_slug
        ELSE left(base_slug, 48) || '-' || suffix::text
      END;

      BEGIN
        INSERT INTO public.studios (name, slug)
        VALUES (requested_studio_name, final_slug)
        RETURNING id INTO new_studio_id;
        EXIT;
      EXCEPTION WHEN unique_violation THEN
        suffix := suffix + 1;
      END;
    END LOOP;

    INSERT INTO public.studio_memberships (studio_id, user_id, role)
    VALUES (new_studio_id, NEW.id, 'owner')
    ON CONFLICT (studio_id, user_id) DO UPDATE SET role = 'owner';

    INSERT INTO public.studio_settings (studio_id, studio_name)
    VALUES (new_studio_id, requested_studio_name)
    ON CONFLICT (studio_id) DO UPDATE SET studio_name = EXCLUDED.studio_name;
  END IF;

  RETURN NEW;
END;
$$;
