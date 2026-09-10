
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Player',
  avatar TEXT NOT NULL DEFAULT '🦊',
  relationship_status TEXT NOT NULL DEFAULT 'dating',
  partner_id UUID,
  invite_code TEXT NOT NULL UNIQUE,
  sound_enabled BOOLEAN NOT NULL DEFAULT true,
  haptics_enabled BOOLEAN NOT NULL DEFAULT true,
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  theme TEXT NOT NULL DEFAULT 'light',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_self_or_partner" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR partner_id = auth.uid() OR id IN (SELECT partner_id FROM public.profiles p WHERE p.id = auth.uid()));
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_delete_self" ON public.profiles FOR DELETE TO authenticated USING (id = auth.uid());

CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  host_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  guest_id UUID REFERENCES auth.users ON DELETE SET NULL,
  game_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rooms TO authenticated;
GRANT ALL ON public.rooms TO service_role;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rooms_select_members" ON public.rooms FOR SELECT TO authenticated USING (host_id = auth.uid() OR guest_id = auth.uid());
CREATE POLICY "rooms_insert_host" ON public.rooms FOR INSERT TO authenticated WITH CHECK (host_id = auth.uid());
CREATE POLICY "rooms_update_members" ON public.rooms FOR UPDATE TO authenticated USING (host_id = auth.uid() OR guest_id = auth.uid()) WITH CHECK (host_id = auth.uid() OR guest_id = auth.uid());
CREATE POLICY "rooms_delete_host" ON public.rooms FOR DELETE TO authenticated USING (host_id = auth.uid());

CREATE TABLE public.activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'solo',
  summary TEXT NOT NULL DEFAULT '',
  my_score INTEGER NOT NULL DEFAULT 0,
  their_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity TO authenticated;
GRANT ALL ON public.activity TO service_role;
ALTER TABLE public.activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_all_self" ON public.activity FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER rooms_touch BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.gen_code(len INT DEFAULT 6) RETURNS TEXT
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE alphabet TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; out TEXT := ''; i INT;
BEGIN
  FOR i IN 1..len LOOP
    out := out || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  END LOOP;
  RETURN out;
END; $$;

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c TEXT;
BEGIN
  LOOP
    c := public.gen_code(6);
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE invite_code = c);
  END LOOP;
  INSERT INTO public.profiles (id, display_name, avatar, invite_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1), 'Player'),
    COALESCE(NEW.raw_user_meta_data->>'avatar', '🦊'),
    c
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.lookup_partner(p_code TEXT)
RETURNS TABLE (id UUID, display_name TEXT, avatar TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.display_name, p.avatar FROM public.profiles p
  WHERE upper(p.invite_code) = upper(p_code) AND p.id <> auth.uid() LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.lookup_partner(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.link_partner(p_code TEXT)
RETURNS TABLE (id UUID, display_name TEXT, avatar TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE target UUID;
BEGIN
  SELECT p.id INTO target FROM public.profiles p
    WHERE upper(p.invite_code) = upper(p_code) AND p.id <> auth.uid() LIMIT 1;
  IF target IS NULL THEN RAISE EXCEPTION 'No one found with that code'; END IF;
  UPDATE public.profiles SET partner_id = target WHERE profiles.id = auth.uid();
  UPDATE public.profiles SET partner_id = auth.uid() WHERE profiles.id = target;
  RETURN QUERY SELECT p.id, p.display_name, p.avatar FROM public.profiles p WHERE p.id = target;
END; $$;
GRANT EXECUTE ON FUNCTION public.link_partner(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.join_room(p_code TEXT)
RETURNS SETOF public.rooms
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.rooms;
BEGIN
  SELECT * INTO r FROM public.rooms WHERE upper(code) = upper(p_code) LIMIT 1;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Room not found'; END IF;
  IF r.host_id <> auth.uid() AND r.guest_id IS DISTINCT FROM auth.uid() THEN
    IF r.guest_id IS NOT NULL THEN RAISE EXCEPTION 'Room is full'; END IF;
    UPDATE public.rooms SET guest_id = auth.uid(), status = 'playing' WHERE rooms.id = r.id RETURNING * INTO r;
  END IF;
  RETURN NEXT r;
END; $$;
GRANT EXECUTE ON FUNCTION public.join_room(TEXT) TO authenticated;

ALTER TABLE public.rooms REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
