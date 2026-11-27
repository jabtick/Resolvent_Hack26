-- Documentation only: descriptions shown in the Supabase dashboard next to each table and column.
-- No change to tables, data, grants or RLS. Owner: Gosho. Full overview: docs/database-schema.md

-- Profiles ------------------------------------------------------------------

comment on table public.profiles is
  'One row per user (student or organizer). Deleted with the auth user. Others read it only through public_profiles.';
comment on column public.profiles.account_type is
  'student | organizer. Set once when the profile is created; afterwards only the server changes it.';
comment on column public.profiles.username is
  'Public link /u/<username>. 3-30 chars of A-Z a-z 0-9 _ . -; unique ignoring case.';
comment on column public.profiles.avatar_url is 'Path in Supabase Storage.';
comment on column public.profiles.terms_accepted_at is 'When the user accepted the Terms of Use.';

comment on table public.student_details is
  'Student data, one row per student profile. Owner-only; private by default (is_public = false).';
comment on column public.student_details.birth_date is
  'Needed for parental consent under 14. Set once at sign-up; afterwards only the server changes it.';
comment on column public.student_details.gender is 'Optional. Never shown publicly.';
comment on column public.student_details.grade is 'School grade 1-12; null for university students.';
comment on column public.student_details.is_public is
  'Profile appears in public_profiles only when true. Under-14s also need consent_granted_at.';
comment on column public.student_details.guardian_email is 'Parent email for under-14 consent. Server-only.';
comment on column public.student_details.consent_token_hash is 'Hash of the parent confirmation link token. Server-only.';
comment on column public.student_details.consent_granted_at is 'When the parent confirmed; null = no consent. Server-only.';

comment on table public.organizer_details is
  'The organization behind an organizer account. Readable by everyone.';
comment on column public.organizer_details.verification_status is
  'pending | verified | rejected. Server-only. Only verified organizers can publish. Renaming org_name resets it to pending.';
comment on column public.organizer_details.verified_at is 'When the organizer was verified. Server-only.';

-- Feed ----------------------------------------------------------------------

comment on table public.opportunities is
  'Everything in the feed and calendar: competitions, scholarships, internships, open days, university programs. Scraped items have organizer_id = null and source = scraper.';
comment on column public.opportunities.organizer_id is
  'Who posted it. Filled automatically with the caller; null = scraped.';
comment on column public.opportunities.external_url is 'Where to apply or read more.';
comment on column public.opportunities.is_online is 'True for online and hybrid events.';
comment on column public.opportunities.audience is 'school | university | both.';
comment on column public.opportunities.starts_at is 'When the event starts (calendar).';
comment on column public.opportunities.ends_at is 'When the event ends; never before starts_at.';
comment on column public.opportunities.deadline_at is 'Application / registration deadline (calendar).';
comment on column public.opportunities.status is
  'draft | published | archived. Only published rows are public; publishing requires a verified organizer.';
comment on column public.opportunities.source is
  'organizer | scraper. Clients cannot set it; scraped rows are written by the server (service_role).';
comment on column public.opportunities.source_url is
  'Unique key of a scraped item, used to avoid duplicates on re-import.';
comment on column public.opportunities.search_vector is
  'Full-text search over title + description (config simple: Postgres has no Bulgarian dictionary).';

comment on table public.tags is
  'Fixed tag list for filters and recommendations. Loaded by the team; clients cannot add tags.';
comment on table public.opportunity_tags is 'Tags of an opportunity. Written by the opportunity''s organizer or the server.';
comment on table public.profile_interests is 'A student''s interests (tags), used for recommendations. Owner-only.';
comment on table public.saved_opportunities is 'Opportunities a user saved = "my calendar". Owner-only.';

comment on view public.public_profiles is
  'Safe public view of student profiles for /u/<username>. Only is_public profiles; under-14s only with parental consent. Never exposes birth date, gender, city or emails.';
