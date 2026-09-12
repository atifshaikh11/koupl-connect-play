CREATE OR REPLACE FUNCTION public.join_room(p_code TEXT, p_game_id TEXT DEFAULT NULL)
RETURNS SETOF public.rooms
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.rooms;
BEGIN
  SELECT * INTO r
  FROM public.rooms
  WHERE upper(code) = upper(p_code)
    AND status <> 'closed'
  ORDER BY created_at DESC
  LIMIT 1;

  IF r.id IS NULL THEN
    RAISE EXCEPTION 'No open room with that code';
  END IF;
  IF p_game_id IS NOT NULL AND r.game_id <> p_game_id THEN
    RAISE EXCEPTION 'That code belongs to a different game';
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
    RAISE EXCEPTION 'That room is already full';
  END IF;

  RETURN NEXT r;
END;
$$;

REVOKE ALL ON FUNCTION public.join_room(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_room(TEXT, TEXT) TO authenticated;