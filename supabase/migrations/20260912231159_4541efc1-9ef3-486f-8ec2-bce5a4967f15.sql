CREATE OR REPLACE FUNCTION public.patch_room_state(p_room_id UUID, p_patch JSONB)
RETURNS SETOF public.rooms
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  current_room public.rooms;
  safe_patch JSONB := COALESCE(p_patch, '{}'::jsonb);
  resets_session BOOLEAN := safe_patch ? 'activeGame'
    OR (safe_patch @> '{"started": false, "game": {}}'::jsonb);
BEGIN
  SELECT * INTO current_room
  FROM public.rooms
  WHERE id = p_room_id
    AND status <> 'closed'
    AND (host_id = auth.uid() OR guest_id = auth.uid())
  FOR UPDATE;

  IF current_room.id IS NULL THEN
    RAISE EXCEPTION 'Room is unavailable or you are no longer a member';
  END IF;

  IF resets_session THEN
    safe_patch := (safe_patch - 'hostReady' - 'guestReady')
      || '{"hostReady": false, "guestReady": false}'::jsonb;
  ELSIF current_room.host_id = auth.uid() THEN
    safe_patch := safe_patch - 'guestReady';
  ELSE
    safe_patch := safe_patch - 'hostReady' - 'started';
  END IF;

  IF COALESCE((safe_patch->>'started')::boolean, false)
     AND NOT (
       COALESCE((current_room.state->>'hostReady')::boolean, false)
       AND COALESCE((current_room.state->>'guestReady')::boolean, false)
       AND current_room.guest_id IS NOT NULL
     ) THEN
    RAISE EXCEPTION 'Both players must be ready before starting';
  END IF;

  UPDATE public.rooms
  SET state = COALESCE(state, '{}'::jsonb) || safe_patch
  WHERE id = p_room_id
  RETURNING * INTO current_room;

  RETURN NEXT current_room;
END;
$$;

REVOKE ALL ON FUNCTION public.patch_room_state(UUID, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.patch_room_state(UUID, JSONB) TO authenticated;