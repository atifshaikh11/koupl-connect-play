CREATE OR REPLACE FUNCTION public.patch_room_state(p_room_id UUID, p_patch JSONB)
RETURNS SETOF public.rooms
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  UPDATE public.rooms
  SET state = COALESCE(state, '{}'::jsonb) || COALESCE(p_patch, '{}'::jsonb)
  WHERE id = p_room_id
    AND (host_id = auth.uid() OR guest_id = auth.uid())
  RETURNING *;
$$;

CREATE OR REPLACE FUNCTION public.sync_partner_unlink()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.partner_id IS NOT NULL AND NEW.partner_id IS NULL THEN
    UPDATE public.profiles
    SET partner_id = NULL
    WHERE id = OLD.partner_id AND partner_id = OLD.id;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_partner_unlink() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.unlink_partner() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS sync_partner_unlink_trigger ON public.profiles;
CREATE TRIGGER sync_partner_unlink_trigger
AFTER UPDATE OF partner_id ON public.profiles
FOR EACH ROW
WHEN (OLD.partner_id IS DISTINCT FROM NEW.partner_id)
EXECUTE FUNCTION public.sync_partner_unlink();