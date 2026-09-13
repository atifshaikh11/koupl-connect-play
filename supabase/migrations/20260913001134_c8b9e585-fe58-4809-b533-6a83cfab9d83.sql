
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS invite_token TEXT;

CREATE OR REPLACE FUNCTION public.gen_invite_token()
RETURNS TEXT
LANGUAGE sql
VOLATILE
SET search_path = public
AS $$
  SELECT replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
$$;

UPDATE public.rooms SET invite_token = public.gen_invite_token() WHERE invite_token IS NULL;

ALTER TABLE public.rooms ALTER COLUMN invite_token SET DEFAULT public.gen_invite_token();
ALTER TABLE public.rooms ALTER COLUMN invite_token SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS rooms_invite_token_key ON public.rooms (invite_token);

CREATE OR REPLACE FUNCTION public.join_room_by_token(p_token text, p_game_id text DEFAULT NULL::text)
RETURNS SETOF public.rooms
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.rooms;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to join';
  END IF;
  IF p_token IS NULL OR length(p_token) < 8 THEN
    RAISE EXCEPTION 'That invite link is not valid';
  END IF;

  SELECT * INTO r
  FROM public.rooms
  WHERE invite_token = lower(p_token)
    AND status <> 'closed'
  LIMIT 1;

  IF r.id IS NULL THEN
    RAISE EXCEPTION 'That invite is no longer active';
  END IF;
  IF p_game_id IS NOT NULL AND r.game_id <> p_game_id THEN
    RAISE EXCEPTION 'That invite belongs to a different session';
  END IF;
  IF r.host_id = auth.uid() OR r.guest_id = auth.uid() THEN
    RETURN NEXT r;
    RETURN;
  END IF;

  UPDATE public.rooms
  SET guest_id = auth.uid(), status = 'playing'
  WHERE id = r.id AND guest_id IS NULL
  RETURNING * INTO r;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'That Couple Room is already full';
  END IF;

  RETURN NEXT r;
END;
$$;

REVOKE ALL ON FUNCTION public.join_room_by_token(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_room_by_token(text, text) TO authenticated;
REVOKE ALL ON FUNCTION public.gen_invite_token() FROM PUBLIC, anon;
