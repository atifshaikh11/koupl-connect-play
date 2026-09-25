-- 1. Rooms: clients may only insert/update safe columns; membership columns are changed only by server RPCs.
REVOKE INSERT, UPDATE ON public.rooms FROM authenticated;
GRANT INSERT (code, host_id, game_id, status, state) ON public.rooms TO authenticated;
GRANT UPDATE (status, state) ON public.rooms TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_room_client_update()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user = 'authenticated' THEN
    IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'closed' THEN
      RAISE EXCEPTION 'Rooms can only be closed from the app';
    END IF;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS rooms_guard_client_update ON public.rooms;
CREATE TRIGGER rooms_guard_client_update BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.guard_room_client_update();

CREATE OR REPLACE FUNCTION public.guard_room_client_insert()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user = 'authenticated' THEN
    NEW.guest_id := NULL;
    NEW.status := 'waiting';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS rooms_guard_client_insert ON public.rooms;
CREATE TRIGGER rooms_guard_client_insert BEFORE INSERT ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.guard_room_client_insert();

-- 2. Chat: sender name/avatar come from the sender's own profile, not the client.
CREATE OR REPLACE FUNCTION public.stamp_message_sender()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.profiles;
BEGIN
  SELECT * INTO p FROM public.profiles WHERE id = auth.uid();
  NEW.sender_id := auth.uid();
  NEW.sender_name := left(COALESCE(p.display_name, 'Player'), 40);
  NEW.sender_avatar := left(COALESCE(p.avatar, '🙂'), 16);
  NEW.created_at := now();
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.stamp_message_sender() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS room_messages_stamp_sender ON public.room_messages;
CREATE TRIGGER room_messages_stamp_sender BEFORE INSERT ON public.room_messages
  FOR EACH ROW EXECUTE FUNCTION public.stamp_message_sender();

-- 3. Account deletion must not be blocked by chat history.
ALTER TABLE public.room_messages DROP CONSTRAINT room_messages_sender_id_fkey;
ALTER TABLE public.room_messages ADD CONSTRAINT room_messages_sender_id_fkey
  FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 4. Profile field limits (new/changed rows).
ALTER TABLE public.profiles ADD CONSTRAINT profiles_display_name_len
  CHECK (char_length(display_name) BETWEEN 1 AND 40) NOT VALID;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_avatar_len
  CHECK (char_length(avatar) BETWEEN 1 AND 16) NOT VALID;

-- 5. Partner linking requires the other person to be unlinked (no hijacking an existing couple).
CREATE OR REPLACE FUNCTION public.link_partner(p_code text)
 RETURNS TABLE(id uuid, display_name text, avatar text)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE target UUID; target_partner UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  SELECT p.id, p.partner_id INTO target, target_partner FROM public.profiles p
    WHERE upper(p.invite_code) = upper(p_code) AND p.id <> auth.uid() LIMIT 1;
  IF target IS NULL THEN RAISE EXCEPTION 'No one found with that code'; END IF;
  IF target_partner IS NOT NULL AND target_partner <> auth.uid() THEN
    RAISE EXCEPTION 'That person is already connected to a partner';
  END IF;
  PERFORM public.unlink_partner();
  UPDATE public.profiles SET partner_id = target WHERE profiles.id = auth.uid();
  UPDATE public.profiles SET partner_id = auth.uid() WHERE profiles.id = target;
  RETURN QUERY SELECT p.id, p.display_name, p.avatar FROM public.profiles p WHERE p.id = target;
END; $function$;
REVOKE EXECUTE ON FUNCTION public.link_partner(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.link_partner(text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.lookup_partner(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.unlink_partner() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.join_room(text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.join_room_by_token(text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_room_invite(uuid, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.redeem_room_invite(text) FROM PUBLIC, anon;