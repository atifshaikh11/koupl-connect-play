DROP FUNCTION IF EXISTS public.join_room(text);

REVOKE EXECUTE ON FUNCTION public.join_room(text, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.close_stale_rooms(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.patch_room_state(uuid, jsonb) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.link_partner(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.lookup_partner(text) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.join_room(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.close_stale_rooms(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.patch_room_state(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.link_partner(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_partner(text) TO authenticated;