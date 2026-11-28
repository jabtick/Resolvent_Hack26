REVOKE EXECUTE ON FUNCTION public.choose_account_role(public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_profile() FROM PUBLIC, anon, authenticated;