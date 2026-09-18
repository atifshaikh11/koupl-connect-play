CREATE TABLE IF NOT EXISTS public.room_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  used_by UUID,
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE INDEX IF NOT EXISTS room_invites_room_idx ON public.room_invites(room_id);
CREATE INDEX IF NOT EXISTS room_invites_expires_idx ON public.room_invites(expires_at);

GRANT SELECT ON public.room_invites TO authenticated;
GRANT ALL ON public.room_invites TO service_role;

ALTER TABLE public.room_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Creators read their invites" ON public.room_invites;
CREATE POLICY "Creators read their invites"
ON public.room_invites FOR SELECT TO authenticated
USING (created_by = auth.uid());

-- Create a single-use, 2-hour invitation for a couple room + game.
CREATE OR REPLACE FUNCTION public.create_room_invite(p_room_id UUID, p_token TEXT, p_game_id TEXT)
RETURNS TABLE(expires_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  r public.rooms;
  exp TIMESTAMPTZ := now() + interval '2 hours';
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  IF p_token IS NULL OR length(p_token) < 10 THEN RAISE EXCEPTION 'Invalid invite token'; END IF;
  IF p_game_id IS NULL OR length(p_game_id) = 0 THEN RAISE EXCEPTION 'Invalid game'; END IF;

  SELECT * INTO r FROM public.rooms
  WHERE id = p_room_id AND status <> 'closed'
    AND (host_id = auth.uid() OR guest_id = auth.uid());
  IF r.id IS NULL THEN RAISE EXCEPTION 'Room is unavailable'; END IF;

  -- Retire this room's older outstanding invites: one live ticket at a time.
  UPDATE public.room_invites SET status = 'revoked'
   WHERE room_id = r.id AND used_at IS NULL AND status = 'active';

  INSERT INTO public.room_invites (room_id, game_id, token_hash, created_by, expires_at)
  VALUES (r.id, p_game_id, encode(sha256(p_token::bytea), 'hex'), auth.uid(), exp);

  RETURN QUERY SELECT exp;
END; $$;

-- Read-only look at an invite so the landing page can show the game before auth.
CREATE OR REPLACE FUNCTION public.peek_room_invite(p_token TEXT)
RETURNS TABLE(status TEXT, game_id TEXT)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE inv public.room_invites;
BEGIN
  IF p_token IS NULL OR length(p_token) < 10 THEN
    RETURN QUERY SELECT 'invalid'::TEXT, NULL::TEXT; RETURN;
  END IF;
  SELECT * INTO inv FROM public.room_invites
   WHERE token_hash = encode(sha256(p_token::bytea), 'hex');
  IF inv.id IS NULL THEN RETURN QUERY SELECT 'invalid'::TEXT, NULL::TEXT; RETURN; END IF;
  IF inv.status = 'revoked' THEN RETURN QUERY SELECT 'invalid'::TEXT, inv.game_id; RETURN; END IF;
  IF inv.used_at IS NOT NULL AND inv.used_by IS DISTINCT FROM auth.uid() THEN
    RETURN QUERY SELECT 'used'::TEXT, inv.game_id; RETURN;
  END IF;
  IF inv.expires_at < now() THEN RETURN QUERY SELECT 'expired'::TEXT, inv.game_id; RETURN; END IF;
  RETURN QUERY SELECT 'ok'::TEXT, inv.game_id;
END; $$;

-- Atomic redemption: validate, seat the player, consume the ticket, open the game.
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
    UPDATE public.rooms SET guest_id = uid WHERE id = r.id;
  ELSE
    RETURN QUERY SELECT 'full'::TEXT, NULL::TEXT, inv.game_id; RETURN;
  END IF;

  -- Open the invited game for both phones (only on first redemption).
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

REVOKE ALL ON FUNCTION public.create_room_invite(UUID, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.redeem_room_invite(TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.peek_room_invite(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_room_invite(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_room_invite(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.peek_room_invite(TEXT) TO anon, authenticated;