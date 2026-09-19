CREATE OR REPLACE FUNCTION public.redeem_room_invite(p_token TEXT)
RETURNS TABLE(status TEXT, room_code TEXT, game_id TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  inv public.room_invites;
  r public.rooms;
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN QUERY SELECT 'auth'::TEXT, NULL::TEXT, NULL::TEXT; RETURN; END IF;
  IF p_token IS NULL OR length(p_token) < 10 THEN
    RETURN QUERY SELECT 'invalid'::TEXT, NULL::TEXT, NULL::TEXT; RETURN;
  END IF;

  SELECT * INTO inv FROM public.room_invites
   WHERE token_hash = encode(sha256(p_token::bytea), 'hex')
   FOR UPDATE;

  IF inv.id IS NULL OR inv.status = 'revoked' THEN
    RETURN QUERY SELECT 'invalid'::TEXT, NULL::TEXT, inv.game_id; RETURN;
  END IF;
  IF inv.used_at IS NOT NULL AND inv.used_by IS DISTINCT FROM uid THEN
    RETURN QUERY SELECT 'used'::TEXT, NULL::TEXT, inv.game_id; RETURN;
  END IF;
  IF inv.expires_at < now() THEN
    RETURN QUERY SELECT 'expired'::TEXT, NULL::TEXT, inv.game_id; RETURN;
  END IF;

  SELECT * INTO r FROM public.rooms WHERE id = inv.room_id FOR UPDATE;
  IF r.id IS NULL OR r.status = 'closed' THEN
    RETURN QUERY SELECT 'invalid'::TEXT, NULL::TEXT, inv.game_id; RETURN;
  END IF;

  IF r.host_id = uid OR r.guest_id = uid THEN
    NULL; -- already seated
  ELSIF r.guest_id IS NULL THEN
    UPDATE public.rooms SET guest_id = uid, status = 'playing' WHERE id = r.id;
  ELSE
    RETURN QUERY SELECT 'full'::TEXT, NULL::TEXT, inv.game_id; RETURN;
  END IF;

  IF inv.used_at IS NULL THEN
    UPDATE public.rooms
       SET state = COALESCE(state, '{}'::jsonb) || jsonb_build_object(
             'activeGame', inv.game_id,
             'started', false,
             'hostReady', false,
             'guestReady', false,
             'seed', random(),
             'game', '{}'::jsonb)
     WHERE id = r.id;

    UPDATE public.room_invites
       SET used_at = now(), used_by = uid, status = 'used'
     WHERE id = inv.id;
  END IF;

  RETURN QUERY SELECT 'ok'::TEXT, r.code, inv.game_id;
END; $$;

REVOKE ALL ON FUNCTION public.redeem_room_invite(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_room_invite(TEXT) TO authenticated;