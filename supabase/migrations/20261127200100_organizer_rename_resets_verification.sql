-- A verified organizer who renames their organization goes back to 'pending'
-- (owner: Bogi, security). Otherwise a verified account could rename itself
-- into another organization and keep the "verified" mark.
-- Only client edits count: the server (service_role) and the dashboard can rename freely.
--
-- Column grants don't block this: they check the columns named in the UPDATE,
-- not the ones a BEFORE trigger changes.

create function public.organizer_rename_resets_verification()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user = 'authenticated'
     and new.org_name is distinct from old.org_name
     and old.verification_status = 'verified' then
    new.verification_status := 'pending';
    new.verified_at := null;
  end if;
  return new;
end;
$$;

revoke execute on function public.organizer_rename_resets_verification()
  from public, anon, authenticated;

create trigger organizer_details_rename_resets_verification
  before update of org_name on public.organizer_details
  for each row execute function public.organizer_rename_resets_verification();
