-- Check for public.recommended_feed() (migration 20261128120000_recommended_feed.sql).
--
-- Creates a fake student "Maria" and test opportunities, calls the feed AS that student,
-- compares every rating with values computed by hand, and then ENDS WITH AN ERROR ON PURPOSE:
-- the error rolls the whole transaction back, so nothing is saved. The result is in the error text:
--   "recommended_feed check: PASS ..."  or  "recommended_feed check: FAIL ...".
--
-- How to run (Supabase dashboard -> SQL Editor):
--   * migration NOT pushed yet: paste `begin;` + the migration + this file. In PowerShell, from the repo root:
--       $m = Get-Content supabase\migrations\20261128120000_recommended_feed.sql -Raw -Encoding UTF8
--       $c = Get-Content supabase\checks\recommended_feed_check.sql -Raw -Encoding UTF8
--       "begin;`n$m`n$c" | Set-Clipboard
--     (the second `begin;` only gives a harmless "already a transaction in progress" warning)
--   * migration already pushed: paste just this file
--
-- Maria: grade 10, Burgas, picked informatics + math + robotics at signup.
-- History (all saves, a = 1): h1 10 days ago, h2 30 days ago, h3 90 days ago.
-- Expected values come from the formula in the migration with the default constants.

begin;

create temp table t_opps (
  letter text primary key,
  -- the test name of the opportunity (A, B, ... h1)
  id uuid not null
  -- its real id in public.opportunities
) on commit drop;

do $check$
declare
  v_student uuid := gen_random_uuid();
  -- the fake student "Maria"
  v_id uuid;
  -- id of the opportunity being inserted
  r record;
  -- loop row
  v_all jsonb;
  -- recommended_feed(0, 1000) as Maria: every eligible opportunity with its parts
  v_default jsonb;
  -- recommended_feed() as Maria: only rating >= 0.5
  v_expected jsonb := '{
    "A": [0.803, 0.974, 0.404, 1.000, 0.651],
    "B": [0.711, 1.000, 0.148, 1.000, 0.240],
    "C": [0.776, 0.855, 0.445, 1.000, 0.867],
    "D": [0.139, 0.000, 0.000, 0.600, 0.490],
    "H": [0.412, 0.588, 0.303, 0.000, 0.424],
    "J": [0.587, 0.959, 0.202, 0.000, 0.565]
  }';
  -- letter -> [rating, I, H, L, U] computed by hand
  v_excluded text[] := array['E', 'G', 'I', 'h1', 'h2', 'h3'];
  -- must NOT appear: university-only, wrong grade, expired, already saved
  v_default_order text := 'A,C,B,J';
  -- expected order of the default call (rating >= 0.5, highest first)
  v_tol numeric := 0.002;
  -- allowed difference per number (outputs are rounded to 3 decimals)
  v_got jsonb;
  -- one returned row
  v_exp jsonb;
  -- one expected row
  v_order text;
  -- actual order of the default call
  v_fail int := 0;
  -- number of failed checks
  v_report text := '';
  -- the text shown at the end
  k text;
  -- loop key
  i int;
  -- loop index
  v_names text[] := array['rating', 'interest', 'history', 'location', 'urgency'];
  -- column names, same order as the expected arrays
begin
  -- ---- Tags (only the ones this test needs) ------------------------------
  insert into public.tags (name, slug, kind, is_parent)
  select s, s, kd::public.tag_kind, p
  from (values
    ('informatics', 'topic', false), ('math', 'topic', false), ('robotics', 'topic', false),
    ('programming', 'topic', false), ('engineering', 'topic', false), ('ai-data', 'topic', false),
    ('cybersecurity', 'topic', false), ('debate', 'topic', false), ('physics', 'topic', false),
    ('stem', 'topic', true),
    ('olympiad', 'format', false), ('hackathon', 'format', false), ('team', 'format', false),
    ('summer-school', 'format', false), ('contest', 'format', false), ('career', 'format', false),
    ('national', 'level', false),
    ('grades-5-7', 'grade', false), ('grades-8-10', 'grade', false), ('grades-11-12', 'grade', false)
  ) as x(s, kd, p)
  on conflict (slug) do update set kind = excluded.kind, is_parent = excluded.is_parent;

  -- ---- Maria --------------------------------------------------------------
  insert into auth.users (id, aud, role, email)
  values (v_student, 'authenticated', 'authenticated', 'feed-check-' || v_student || '@example.invalid');

  insert into public.profiles (id, account_type, username, display_name, terms_accepted_at)
  values (v_student, 'student', 'feedcheck_' || left(replace(v_student::text, '-', ''), 8), 'Feed Check', now());

  insert into public.student_details (profile_id, birth_date, city, grade)
  values (v_student, date '2010-05-01', 'Burgas', 10);

  insert into public.profile_interests (profile_id, tag_id)
  select v_student, t.id from public.tags t where t.slug in ('informatics', 'math', 'robotics');

  -- ---- Opportunities --------------------------------------------------------
  for r in
    select * from (values
      ('A',  'competition', 'Burgas',  false, 'school',     now() + interval '6 days',  null::timestamptz,          array['robotics','contest','engineering','stem','team','grades-8-10','grades-11-12']),
      ('B',  'competition', null,      true,  'both',       now() + interval '20 days', null,                       array['cybersecurity','informatics','contest','team']),
      ('C',  'competition', 'Burgas',  false, 'school',     now() + interval '2 days',  null,                       array['math','olympiad','stem','grades-5-7','grades-8-10','grades-11-12']),
      ('D',  'competition', 'Sofia',   false, 'both',       now() + interval '10 days', null,                       array['debate','contest','national']),
      ('H',  'competition', 'Plovdiv', false, 'both',       now() + interval '12 days', null,                       array['hackathon','programming','team','ai-data']),
      ('J',  'open_day',    'Varna',   false, 'both',       null,                       now() + interval '8 days',  array['robotics','engineering','career']),
      ('E',  'internship',  'Sofia',   false, 'university', now() + interval '15 days', null,                       array['programming']),
      ('G',  'competition', 'Burgas',  false, 'school',     now() + interval '5 days',  null,                       array['math','summer-school','grades-5-7']),
      ('I',  'competition', 'Burgas',  false, 'both',       now() - interval '3 days',  null,                       array['physics']),
      ('h1', 'competition', null,      false, 'school',     now() + interval '30 days', null,                       array['informatics','olympiad','stem']),
      ('h2', 'competition', 'Varna',   false, 'both',       now() - interval '10 days', null,                       array['robotics','hackathon','programming','team','engineering','stem']),
      ('h3', 'competition', null,      true,  'both',       now() - interval '60 days', null,                       array['ai-data','programming','summer-school'])
    ) as x(letter, type, city, online, audience, deadline_at, starts_at, tags)
  loop
    insert into public.opportunities
      (type, title, city, is_online, audience, deadline_at, starts_at, status, source, organizer_id)
    values
      (r.type::public.opportunity_type, 'FEED CHECK ' || r.letter, r.city, r.online,
       r.audience::public.audience, r.deadline_at, r.starts_at, 'published', 'scraper', null)
    returning id into v_id;

    insert into public.opportunity_tags (opportunity_id, tag_id)
    select v_id, t.id from public.tags t where t.slug = any (r.tags);

    insert into t_opps values (r.letter, v_id);
  end loop;

  -- ---- Maria's history: three saves ------------------------------------------
  insert into public.saved_opportunities (profile_id, opportunity_id, created_at)
  select v_student, o.id, now() - make_interval(days => d)
  from (values ('h1', 10), ('h2', 30), ('h3', 90)) as x(letter, d)
  join t_opps o on o.letter = x.letter;

  -- ---- Call the feed AS Maria (RLS applies) ----------------------------------
  perform set_config('request.jwt.claims',
                     json_build_object('sub', v_student, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select coalesce(jsonb_agg(to_jsonb(f)), '[]') into v_all
  from public.recommended_feed(0, 1000) f;

  select coalesce(jsonb_agg(to_jsonb(f)), '[]') into v_default
  from public.recommended_feed() f;

  reset role;

  -- ---- Compare ---------------------------------------------------------------
  -- 1. every expected opportunity is there with the right numbers
  for k in select jsonb_object_keys(v_expected) order by 1 loop
    v_exp := v_expected -> k;
    v_got := null;
    select e.val into v_got
    from jsonb_array_elements(v_all) as e(val)
    join t_opps o on o.id = (e.val ->> 'opportunity_id')::uuid
    where o.letter = k;

    if v_got is null then
      v_fail := v_fail + 1;
      v_report := v_report || format(E'\n  %s: MISSING from the feed', k);
      continue;
    end if;

    for i in 1 .. 5 loop
      if abs((v_got ->> v_names[i])::numeric - (v_exp ->> (i - 1))::numeric) > v_tol then
        v_fail := v_fail + 1;
        v_report := v_report || format(E'\n  %s.%s: got %s, expected %s',
                                       k, v_names[i], v_got ->> v_names[i], v_exp ->> (i - 1));
      end if;
    end loop;

    v_report := v_report || format(E'\n  %s: rating %s (I %s, H %s, L %s, U %s)', k,
      v_got ->> 'rating', v_got ->> 'interest', v_got ->> 'history', v_got ->> 'location', v_got ->> 'urgency');
  end loop;

  -- 2. filtered opportunities are not there
  for k in select unnest(v_excluded) loop
    if exists (select 1 from jsonb_array_elements(v_all) as e(val)
               join t_opps o on o.id = (e.val ->> 'opportunity_id')::uuid
               where o.letter = k) then
      v_fail := v_fail + 1;
      v_report := v_report || format(E'\n  %s: should have been filtered out', k);
    end if;
  end loop;

  -- 3. the default call returns only rating >= 0.5, in the right order
  select string_agg(o.letter, ',' order by ord) into v_order
  from jsonb_array_elements(v_default) with ordinality as e(val, ord)
  join t_opps o on o.id = (e.val ->> 'opportunity_id')::uuid;

  if coalesce(v_order, '') <> v_default_order then
    v_fail := v_fail + 1;
    v_report := v_report || format(E'\n  default feed order: got %s, expected %s', v_order, v_default_order);
  else
    v_report := v_report || format(E'\n  default feed (rating >= 0.5): %s', v_order);
  end if;

  -- ---- Report and roll back --------------------------------------------------
  raise exception 'recommended_feed check: % (rolled back, nothing saved)%',
    case when v_fail = 0 then 'PASS' else format('FAIL, %s problem(s)', v_fail) end,
    v_report;
end;
$check$;
