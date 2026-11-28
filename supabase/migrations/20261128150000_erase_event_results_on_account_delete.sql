-- GDPR: when a student's account is deleted, the participant rows that were matched
-- to them (full name, email) must go too. event_results.profile_id is only
-- "on delete set null", which would leave the name and email behind.
-- Runs on any deletion path (delete-account, Dashboard, SQL), because it is a trigger
-- on profiles, which is deleted by the cascade from auth.users.
-- Badges already go with the profile (on delete cascade).

create or replace function public.erase_event_results_of_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.event_results where profile_id = old.id;
  return old;
end;
$$;

revoke all on function public.erase_event_results_of_profile() from public, anon, authenticated;

drop trigger if exists erase_event_results_on_profile_delete on public.profiles;
create trigger erase_event_results_on_profile_delete
  before delete on public.profiles
  for each row execute function public.erase_event_results_of_profile();
