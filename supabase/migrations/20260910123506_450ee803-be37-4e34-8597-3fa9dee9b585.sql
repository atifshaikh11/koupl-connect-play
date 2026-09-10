
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.gen_code(INT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.lookup_partner(TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.link_partner(TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.join_room(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lookup_partner(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.link_partner(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_room(TEXT) TO authenticated;
