DROP POLICY IF EXISTS profiles_select_self_or_partner ON public.profiles;

CREATE POLICY profiles_select_self_or_partner
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid() OR partner_id = auth.uid());