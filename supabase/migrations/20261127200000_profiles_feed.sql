-- Profiles + feed schema (proposal by Bogi, tables owned by Gosho and Niki).
-- Spec: docs/database-schema.md
--
-- Security model:
--   * RLS on every table.
--   * Column-level grants decide WHICH columns a client may write; RLS decides WHICH rows.
--     Server-only columns (consent, verification, account_type after insert, birth_date after
--     insert) are simply not granted to `authenticated`. Edge Functions (service_role) bypass both.
--   * All user data hangs off profiles(id) -> auth.users(id) ON DELETE CASCADE,
--     so delete-account removes everything.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.account_type        as enum ('student', 'organizer');
create type public.gender              as enum ('male', 'female', 'other', 'prefer_not_to_say');
create type public.org_type            as enum ('school', 'university', 'ngo', 'company', 'public_body');
create type public.verification_status as enum ('pending', 'verified', 'rejected');
create type public.opportunity_type    as enum ('competition', 'scholarship', 'internship', 'open_day', 'university_program');
create type public.audience            as enum ('school', 'university', 'both');
create type public.opportunity_status  as enum ('draft', 'published', 'archived');
create type public.opportunity_source  as enum ('organizer', 'scraper');

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  account_type      public.account_type not null,
  username          text not null check (username ~ '^[A-Za-z0-9_.-]{3,30}$'),
  display_name      text not null check (char_length(display_name) between 1 and 80),
  avatar_url        text,
  terms_accepted_at timestamptz not null,
  created_at        timestamptz not null default now()
);

-- Fix 5: "Ivan" and "ivan" cannot both exist.
create unique index profiles_username_lower_key on public.profiles (lower(username));

create table public.student_details (
  profile_id         uuid primary key references public.profiles (id) on delete cascade,
  birth_date         date not null check (birth_date > date '1900-01-01'),
  gender             public.gender,
  city               text,
  school             text,
  grade              smallint check (grade between 1 and 12),
  bio                text check (char_length(bio) <= 1000),
  is_public          boolean not null default false,  -- GDPR art. 25(2): private by default
  -- Parental consent (under 14). Server-only.
  guardian_email     text,
  consent_token_hash text,
  consent_granted_at timestamptz
);

create table public.organizer_details (
  profile_id          uuid primary key references public.profiles (id) on delete cascade,
  org_name            text not null check (char_length(org_name) between 1 and 120),
  org_type            public.org_type not null,
  website             text,
  -- Server-only.
  verification_status public.verification_status not null default 'pending',
  verified_at         timestamptz
);

-- ---------------------------------------------------------------------------
-- Feed
-- ---------------------------------------------------------------------------

create table public.opportunities (
  id            uuid primary key default gen_random_uuid(),
  type          public.opportunity_type not null,
  -- null = scraped. Defaults to the caller, and clients cannot set it themselves.
  organizer_id  uuid default auth.uid() references public.profiles (id) on delete cascade,
  title         text not null check (char_length(title) between 1 and 200),
  description   text,
  image_url     text,
  external_url  text,
  city          text,
  is_online     boolean not null default false,
  audience      public.audience not null default 'both',
  starts_at     timestamptz,
  ends_at       timestamptz,
  deadline_at   timestamptz,
  status        public.opportunity_status not null default 'draft',
  source        public.opportunity_source not null default 'organizer',
  source_url    text unique,
  search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) stored,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at >= starts_at),
  check ((source = 'organizer') = (organizer_id is not null))
);

create index opportunities_feed_idx      on public.opportunities (status, deadline_at);
create index opportunities_organizer_idx on public.opportunities (organizer_id);
create index opportunities_type_idx      on public.opportunities (type);
create index opportunities_search_idx    on public.opportunities using gin (search_vector);

create table public.tags (
  id   smallint generated always as identity primary key,
  name text not null unique,
  slug text not null unique
);

create table public.opportunity_tags (
  opportunity_id uuid     not null references public.opportunities (id) on delete cascade,
  tag_id         smallint not null references public.tags (id) on delete cascade,
  primary key (opportunity_id, tag_id)
);
create index opportunity_tags_tag_idx on public.opportunity_tags (tag_id);

create table public.profile_interests (
  profile_id uuid     not null references public.profiles (id) on delete cascade,
  tag_id     smallint not null references public.tags (id) on delete cascade,
  primary key (profile_id, tag_id)
);
create index profile_interests_tag_idx on public.profile_interests (tag_id);

create table public.saved_opportunities (
  profile_id     uuid not null references public.profiles (id) on delete cascade,
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  created_at     timestamptz not null default now(),
  primary key (profile_id, opportunity_id)
);
create index saved_opportunities_opportunity_idx on public.saved_opportunities (opportunity_id);

-- updated_at
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger opportunities_set_updated_at
  before update on public.opportunities
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Column-level grants
-- Supabase grants ALL on new tables to anon/authenticated by default. Take it back,
-- then grant only what each role may touch.
-- ---------------------------------------------------------------------------

revoke all on public.profiles, public.student_details, public.organizer_details,
              public.opportunities, public.tags, public.opportunity_tags,
              public.profile_interests, public.saved_opportunities
  from anon, authenticated;

-- profiles: account_type only on insert (fix 2).
grant select on public.profiles to authenticated;
grant insert (id, account_type, username, display_name, avatar_url, terms_accepted_at)
  on public.profiles to authenticated;
grant update (username, display_name, avatar_url, terms_accepted_at)
  on public.profiles to authenticated;

-- student_details: birth_date only on insert, consent columns never (fix 1).
grant select on public.student_details to authenticated;
grant insert (profile_id, birth_date, gender, city, school, grade, bio, is_public)
  on public.student_details to authenticated;
grant update (gender, city, school, grade, bio, is_public)
  on public.student_details to authenticated;

-- organizer_details: verification columns never.
grant select on public.organizer_details to anon, authenticated;
grant insert (profile_id, org_name, org_type, website) on public.organizer_details to authenticated;
grant update (org_name, org_type, website)             on public.organizer_details to authenticated;

-- opportunities: organizer_id and source come from defaults, clients cannot set them (fix 4).
grant select on public.opportunities to anon, authenticated;
grant insert (type, title, description, image_url, external_url, city, is_online, audience,
              starts_at, ends_at, deadline_at, status)
  on public.opportunities to authenticated;
grant update (type, title, description, image_url, external_url, city, is_online, audience,
              starts_at, ends_at, deadline_at, status)
  on public.opportunities to authenticated;
grant delete on public.opportunities to authenticated;

grant select on public.tags to anon, authenticated;  -- fixed list, loaded by us

grant select         on public.opportunity_tags    to anon, authenticated;
grant insert, delete on public.opportunity_tags    to authenticated;

grant select, insert, delete on public.profile_interests   to authenticated;
grant select, insert, delete on public.saved_opportunities to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles            enable row level security;
alter table public.student_details     enable row level security;
alter table public.organizer_details   enable row level security;
alter table public.opportunities       enable row level security;
alter table public.tags                enable row level security;
alter table public.opportunity_tags    enable row level security;
alter table public.profile_interests   enable row level security;
alter table public.saved_opportunities enable row level security;

-- profiles: owner only. Others see public data through public_profiles.
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- student_details: owner only, and only on a student profile.
create policy student_details_select_own on public.student_details
  for select to authenticated using (profile_id = (select auth.uid()));
create policy student_details_insert_own on public.student_details
  for insert to authenticated with check (
    profile_id = (select auth.uid())
    and exists (select 1 from public.profiles p
                where p.id = profile_id and p.account_type = 'student')
  );
create policy student_details_update_own on public.student_details
  for update to authenticated
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));

-- organizer_details: everyone reads; owner writes, only on an organizer profile.
create policy organizer_details_select_all on public.organizer_details
  for select to anon, authenticated using (true);
create policy organizer_details_insert_own on public.organizer_details
  for insert to authenticated with check (
    profile_id = (select auth.uid())
    and exists (select 1 from public.profiles p
                where p.id = profile_id and p.account_type = 'organizer')
  );
create policy organizer_details_update_own on public.organizer_details
  for update to authenticated
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));

-- opportunities: published ones are public; organizers see and write their own.
-- Fix 3: an unverified organizer can only keep drafts / archived items.
-- Fix 4: organizer_id must be the caller and source must be 'organizer'.
create policy opportunities_select on public.opportunities
  for select to anon, authenticated
  using (status = 'published' or organizer_id = (select auth.uid()));

create policy opportunities_insert_own on public.opportunities
  for insert to authenticated with check (
    organizer_id = (select auth.uid())
    and source = 'organizer'
    and exists (select 1 from public.organizer_details o
                where o.profile_id = (select auth.uid())
                  and (status <> 'published' or o.verification_status = 'verified'))
  );

create policy opportunities_update_own on public.opportunities
  for update to authenticated
  using (organizer_id = (select auth.uid()))
  with check (
    organizer_id = (select auth.uid())
    and source = 'organizer'
    and exists (select 1 from public.organizer_details o
                where o.profile_id = (select auth.uid())
                  and (status <> 'published' or o.verification_status = 'verified'))
  );

create policy opportunities_delete_own on public.opportunities
  for delete to authenticated using (organizer_id = (select auth.uid()));

-- tags: read-only for clients.
create policy tags_select_all on public.tags
  for select to anon, authenticated using (true);

-- opportunity_tags: everyone reads; the opportunity's organizer writes.
create policy opportunity_tags_select_all on public.opportunity_tags
  for select to anon, authenticated using (true);
create policy opportunity_tags_insert_own on public.opportunity_tags
  for insert to authenticated with check (
    exists (select 1 from public.opportunities o
            where o.id = opportunity_id and o.organizer_id = (select auth.uid()))
  );
create policy opportunity_tags_delete_own on public.opportunity_tags
  for delete to authenticated using (
    exists (select 1 from public.opportunities o
            where o.id = opportunity_id and o.organizer_id = (select auth.uid()))
  );

-- profile_interests, saved_opportunities: owner only.
create policy profile_interests_own on public.profile_interests
  for all to authenticated
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));

create policy saved_opportunities_own on public.saved_opportunities
  for all to authenticated
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Public profile view (/u/<username>)
-- Runs with the owner's rights on purpose (no security_invoker): student rows are
-- owner-only under RLS, and this view exposes only the safe columns.
-- Never shows birth_date, gender, city, guardian_email or email.
-- Under-14s without parental consent are hidden even if is_public = true.
-- ---------------------------------------------------------------------------

create view public.public_profiles as
select
  p.username,
  p.display_name,
  p.avatar_url,
  s.bio,
  s.school,
  coalesce(
    (select array_agg(t.name order by t.name)
       from public.profile_interests pi
       join public.tags t on t.id = pi.tag_id
      where pi.profile_id = p.id),
    '{}'
  ) as interests
from public.profiles p
join public.student_details s on s.profile_id = p.id
where s.is_public
  and (s.birth_date <= current_date - interval '14 years'
       or s.consent_granted_at is not null);

revoke all on public.public_profiles from anon, authenticated;
grant select on public.public_profiles to anon, authenticated;
