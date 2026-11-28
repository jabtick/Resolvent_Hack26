-- Public organizer page (/u/<username>) and the organizer dashboard.
-- Safe to run twice (create or replace, idempotent grants).

-- 1. Public view of an organizer: only what is already public in organizer_details
--    plus the username. Never email or anything from `profiles` beyond the name.
create or replace view public.public_organizers as
select
  p.id as profile_id,
  p.username,
  p.display_name,
  p.avatar_url,
  o.org_name,
  o.org_type,
  o.website,
  o.verification_status
from public.profiles p
join public.organizer_details o on o.profile_id = p.id;

revoke all on public.public_organizers from anon, authenticated;
grant select on public.public_organizers to anon, authenticated;

-- 2. Dashboard numbers: how many people saved each of MY opportunities.
--    saved_opportunities is owner-only under RLS, so this runs with elevated
--    rights, but returns only counts, and only for the caller's own items.
create or replace function public.my_opportunity_stats()
returns table (opportunity_id uuid, title text, status public.opportunity_status, saves bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select o.id, o.title, o.status, count(s.opportunity_id)
  from public.opportunities o
  left join public.saved_opportunities s on s.opportunity_id = o.id
  where o.organizer_id = auth.uid()
  group by o.id
  order by o.created_at desc;
$$;

revoke all on function public.my_opportunity_stats() from public, anon;
grant execute on function public.my_opportunity_stats() to authenticated;
