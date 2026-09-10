CREATE OR REPLACE FUNCTION public.patch_room_state(p_room_id UUID, p_patch JSONB)
RETURNS SETOF public.rooms
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.rooms
    WHERE id = p_room_id
      AND (host_id = auth.uid() OR guest_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Room not found or access denied';
  END IF;

  RETURN QUERY
  UPDATE public.rooms
  SET state = COALESCE(state, '{}'::jsonb) || COALESCE(p_patch, '{}'::jsonb)
  WHERE id = p_room_id
  RETURNING *;
END;
$$;

REVOKE ALL ON FUNCTION public.patch_room_state(UUID, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.patch_room_state(UUID, JSONB) TO authenticated;

CREATE OR REPLACE FUNCTION public.unlink_partner()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  partner UUID;
BEGIN
  SELECT partner_id INTO partner FROM public.profiles WHERE id = auth.uid();
  UPDATE public.profiles SET partner_id = NULL WHERE id = auth.uid();
  IF partner IS NOT NULL THEN
    UPDATE public.profiles SET partner_id = NULL WHERE id = partner AND partner_id = auth.uid();
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.unlink_partner() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.unlink_partner() TO authenticated;