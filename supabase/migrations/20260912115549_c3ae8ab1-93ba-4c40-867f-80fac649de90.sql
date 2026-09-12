CREATE OR REPLACE FUNCTION public.join_room(p_code text, p_game_id text DEFAULT NULL)
 RETURNS SETOF public.rooms
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE r public.rooms;
BEGIN
  SELECT * INTO r FROM public.rooms
   WHERE upper(code) = upper(p_code) AND status <> 'closed'
   ORDER BY created_at DESC LIMIT 1;
  IF r.id IS NULL THEN RAISE EXCEPTION 'No open room with that code'; END IF;
  IF p_game_id IS NOT NULL AND r.game_id <> p_game_id THEN
    RAISE EXCEPTION 'That code belongs to a different game';
  END IF;
  IF r.host_id <> auth.uid() AND r.guest_id IS DISTINCT FROM auth.uid() THEN
    IF r.guest_id IS NOT NULL THEN RAISE EXCEPTION 'That room is already full'; END IF;
    UPDATE public.rooms SET guest_id = auth.uid(), status = 'playing'
      WHERE rooms.id = r.id RETURNING * INTO r;
  END IF;
  RETURN NEXT r;
END; $function$;

CREATE OR REPLACE FUNCTION public.close_stale_rooms(p_game_id text)
 RETURNS void
 LANGUAGE sql
 SET search_path TO 'public'
AS $function$
  UPDATE public.rooms SET status = 'closed'
   WHERE host_id = auth.uid() AND game_id = p_game_id AND status <> 'closed';
$function$;