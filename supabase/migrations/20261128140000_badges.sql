-- Badges and event results (schema only).
-- Spec: docs/database-schema.md, section "Значки и резултати".
--
-- Flow this schema is built for (the server parts are NOT implemented yet):
--   1. The organizer of a competition uploads results (Excel).
--   2. The server writes one row per participant into event_results.
--   3. The server matches rows to student profiles and writes badges.
--
-- Security model:
--   * Clients never insert badges or results. Only the server (service_role, which bypasses
--     RLS and grants) writes them, so a badge cannot be forged from the browser.
--   * event_results holds names and emails of participants, so only the organizer of that
--     event can read it. Students see their own badges; everyone else sees badges only
--     through public_badges, with the same rules as public_profiles.
--   * A badge keeps a copy of the event title, organizer name and date, so it survives if
--     the organizer later deletes the event or their account (opportunity_id -> null).

-- ---------------------------------------------------------------------------
-- event_results: one row per participant, as uploaded by the organizer
-- ---------------------------------------------------------------------------

create table public.event_results (
  id             uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  -- Final rank (1 = winner). null = took part, no rank given.
  rank           smallint check (rank >= 1),
  full_name      text not null check (char_length(full_name) between 1 and 120),
  -- Stored lowercased, used to match the row to a profile. Matching rule is still open.
  email          text check (email = lower(email) and char_length(email) <= 254),
  -- The matched student. null = not matched yet (e.g. no account yet).
  profile_id     uuid references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now()
);

create index event_results_opportunity_idx on public.event_results (opportunity_id);
create index event_results_profile_idx     on public.event_results (profile_id);
-- Finding unmatched rows for a newly verified email.
create index event_results_unmatched_email_idx on public.event_results (email)
  where profile_id is null;
-- The same person cannot appear twice in one event's results.
create unique index event_results_opportunity_email_key
  on public.event_results (opportunity_id, email) where email is not null;

-- ---------------------------------------------------------------------------
-- badges: what a student has earned
-- ---------------------------------------------------------------------------

create table public.badges (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid not null references public.profiles (id) on delete cascade,
  opportunity_id uuid references public.opportunities (id) on delete set null,
  result_id      uuid references public.event_results (id) on delete set null,
  -- 1, 2, 3 = podium place; null = participation.
  place          smallint check (place between 1 and 3),
  -- Copied from the event when the badge is awarded.
  event_title    text not null check (char_length(event_title) between 1 and 200),
  org_name       text not null check (char_length(org_name) between 1 and 120),
  event_date     date not null,
  -- The student can hide a badge from their public profile. Only column they can change.
  is_hidden      boolean not null default false,
  awarded_at     timestamptz not null default now(),
  unique (profile_id, opportunity_id)
);

create index badges_opportunity_idx on public.badges (opportunity_id);

-- ---------------------------------------------------------------------------
-- Grants: read-only for clients, except badges.is_hidden for the owner
-- ---------------------------------------------------------------------------

revoke all on public.event_results, public.badges from anon, authenticated;

grant select on public.event_results to authenticated;
grant select on public.badges to authenticated;
grant update (is_hidden) on public.badges to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.event_results enable row level security;
alter table public.badges        enable row level security;

-- event_results: only the organizer of the event.
create policy event_results_select_organizer on public.event_results
  for select to authenticated using (
    exists (select 1 from public.opportunities o
            where o.id = opportunity_id and o.organizer_id = (select auth.uid()))
  );

-- badges: the student who owns it, and the organizer of the event.
create policy badges_select_own on public.badges
  for select to authenticated using (profile_id = (select auth.uid()));

create policy badges_select_organizer on public.badges
  for select to authenticated using (
    exists (select 1 from public.opportunities o
            where o.id = opportunity_id and o.organizer_id = (select auth.uid()))
  );

-- The owner may hide or show their own badge (column grant limits it to is_hidden).
create policy badges_update_own on public.badges
  for update to authenticated
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Public badges (/u/<username>, shared badge links)
-- Runs with the owner's rights on purpose, like public_profiles: same visibility rules
-- (public profile, and under-14s only with parental consent), minus hidden badges.
-- ---------------------------------------------------------------------------

create view public.public_badges as
select
  b.id,
  p.username,
  b.opportunity_id,
  b.event_title,
  b.org_name,
  b.event_date,
  b.place,
  b.awarded_at
from public.badges b
join public.profiles p        on p.id = b.profile_id
join public.student_details s on s.profile_id = p.id
where not b.is_hidden
  and s.is_public
  and (s.birth_date <= current_date - interval '14 years'
       or s.consent_granted_at is not null);

revoke all on public.public_badges from anon, authenticated;
grant select on public.public_badges to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Descriptions for the dashboard
-- ---------------------------------------------------------------------------

comment on table public.event_results is
  'One row per participant from an organizer''s results upload. Written only by the server; read only by the event''s organizer.';
comment on column public.event_results.rank is 'Final rank, 1 = winner. null = participated without a rank.';
comment on column public.event_results.email is 'Lowercased. Used to match the row to a student profile.';
comment on column public.event_results.profile_id is 'Matched student. null = not matched yet.';

comment on table public.badges is
  'Badges earned by students. Written only by the server, so they cannot be forged.';
comment on column public.badges.place is '1, 2, 3 = podium place; null = participation badge.';
comment on column public.badges.event_title is 'Copied from the event at award time, so the badge survives if the event is deleted.';
comment on column public.badges.is_hidden is 'Student hides the badge from their public profile. The only column a client can change.';

comment on view public.public_badges is
  'Badges visible to everyone: public profiles only, under-14s only with parental consent, hidden badges excluded.';
