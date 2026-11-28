-- Recommended feed: one rating 0..1 for every opportunity, for the logged-in student.
-- Algorithm: Niki (2026-11-28). Feed SQL owner: Gosho.
--
--   rating(v,p) = 0.50·I + 0.25·H + 0.15·L + 0.10·U
--   shown when the filter F(v,p) passes and rating >= 0.5, highest first
--
--   I = interest match     1 − Π(1 − w̃(t)) over the opportunity's topic/format tags
--   H = history similarity  max over history items of Jaccard(tags) · δ(h)
--   L = location fit        1 online / same city, 0.6 national elsewhere, 0.5 unknown, 0 otherwise
--   U = urgency             e^(−days_to_deadline / 14)
--
--   w̃(t) = per-tag interest weight: Black–Litterman blend of the interests picked at signup
--          and what the student actually saved / competed in, with EWMA time decay.
--
-- Usage from the site:  supabase.rpc('recommended_feed')                       -> rating >= 0.5
--                       supabase.rpc('recommended_feed', { p_min_rating: 0 })  -> everything, e.g. "Explore"

-- ---------------------------------------------------------------------------
-- Tag kinds: which tags count toward interest
-- ---------------------------------------------------------------------------

create type public.tag_kind as enum ('topic', 'format', 'level', 'cost', 'grade');
-- topic  = subject (math, informatics, biology, debate ...)            -> counts toward interest
-- format = kind of event (olympiad, hackathon, summer-school, team ...) -> counts toward interest
-- level  = national / international / regional                          -> used only for location (L)
-- cost   = free / paid / has-fee / prizes                                -> not used by the feed
-- grade  = grades-1-4 ... grades-11-12, university-students             -> used only for the grade filter

alter table public.tags
  add column kind public.tag_kind not null default 'topic',
  -- what the tag describes (see the enum above); the tag loader must set it for every tag
  add column is_parent boolean not null default false;
  -- true for umbrella tags the normalizer adds automatically (stem, foreign-languages):
  -- behaviour on them counts half, so they don't become everyone's "top interest"

comment on column public.tags.kind is
  'What the tag describes. Only topic and format tags count toward a student''s interests in recommended_feed().';
comment on column public.tags.is_parent is
  'Umbrella tag added automatically (stem, foreign-languages). Counts half when learning interests from behaviour.';

-- ---------------------------------------------------------------------------
-- recommended_feed()
-- ---------------------------------------------------------------------------

create function public.recommended_feed(
  p_min_rating double precision default 0.5,
  -- θ: cutoff; only opportunities with rating >= this are returned. Pass 0 to get every eligible one
  p_limit integer default 50
  -- maximum number of rows returned
)
returns table (
  opportunity_id uuid,
  -- the recommended opportunity
  rating numeric,
  -- the final rating 0..1 (rounded to 3 decimals)
  interest numeric,
  -- I: interest match 0..1 (returned so the site can say "Matches: informatics")
  history numeric,
  -- H: history similarity 0..1 ("Like the hackathon you competed in")
  location numeric,
  -- L: location fit 0..1
  urgency numeric
  -- U: urgency 0..1 ("Deadline in 2 days")
)
language sql
stable
security invoker
-- runs as the caller, so RLS applies: a student only ever reads their own interests and saves
set search_path = ''
as $$
with
-- ===== Constants (tune here) ==============================================
k as (
  select
    0.50::float8 as w_interest,
    -- weight of I in the rating
    0.25::float8 as w_history,
    -- weight of H in the rating
    0.15::float8 as w_location,
    -- weight of L in the rating
    0.10::float8 as w_urgency,
    -- weight of U in the rating; the four weights sum to 1, so the rating stays in 0..1
    60::float8 as half_life_days,
    -- λ: after this many days an action counts half (EWMA decay)
    5::float8 as tau,
    -- τ: confidence in the signup interests, measured in actions.
    -- When the student has τ actions' worth of history, signup and behaviour weigh the same
    1::float8 as a_saved,
    -- a_h for a save: the unit the other actions are measured in
    2::float8 as a_competed,
    -- a_h for taking part in a competition (participation badge). Unused until the badges table exists
    3::float8 as a_placed,
    -- a_h for placing 1st–3rd. Unused until the badges table exists
    0.5::float8 as parent_factor,
    -- g_t for parent tags (tags.is_parent): behaviour on them counts half
    0.6::float8 as l_national_elsewhere,
    -- L for a national/international event in another city (worth travelling for)
    0.5::float8 as l_city_unknown,
    -- L when the opportunity is not online and has no city
    14::float8 as urgency_days,
    -- κ: urgency scale; deadline in κ days -> U = e^-1 ≈ 0.37
    0.3::float8 as u_no_date
    -- U when the opportunity has no deadline and no start date
),

-- ===== The student (v) =====================================================
me as (
  select
    s.profile_id,
    -- v: the logged-in student (no row for organizers or anonymous users -> empty feed)
    lower(btrim(s.city)) as city,
    -- city(v), normalised for comparison
    s.grade,
    -- grade(v): 1–12, null for university students
    (case when s.grade is null then 'university' else 'school' end)::public.audience as level
    -- level(v): which audience the student belongs to
  from public.student_details s
  where s.profile_id = (select auth.uid())
),

-- ===== History: what the student did =======================================
hist as (
  select
    so.opportunity_id,
    -- h: one history item (the opportunity it is about)
    k.a_saved as a,
    -- a_h: how strong the action is
    power(0.5, (extract(epoch from (now() - so.created_at)) / 86400.0)::float8 / k.half_life_days) as delta
    -- δ(h) = 0.5^(days / λ): 1 today, 0.5 after λ days, 0.25 after 2λ
  from public.saved_opportunities so
  join me on me.profile_id = so.profile_id
  cross join k
  -- TODO(badges): union all one row per participation (a_competed) / placement (a_placed)
  --               once Zahari's badges table exists
),

hist_opp as (
  select
    h.opportunity_id,
    -- one row per opportunity in the history (a save and a badge on the same one collapse here)
    max(h.delta) as delta
    -- δ of the most recent action on it
  from hist h
  group by h.opportunity_id
),

n_v as (
  select
    coalesce(sum(h.delta), 0)::float8 as n
    -- n_v = Σ δ(h): how active the student is (decayed number of actions)
  from hist h
),

interest_tags as (
  select
    t.id as tag_id,
    -- 𝒯*: the tags that count toward interest (topic and format)
    t.is_parent
    -- whether g_t = parent_factor for this tag
  from public.tags t
  where t.kind in ('topic', 'format')
),

-- ===== Interest weight per tag: w̃_v(t) =====================================
obs as (
  select
    it.tag_id,
    sum(h.a * h.delta) * (case when it.is_parent then max(k.parent_factor) else 1 end) as obs
    -- obs_v(t) = g_t · Σ a_h·δ(h) over the history items that carry tag t
  from hist h
  join public.opportunity_tags ot on ot.opportunity_id = h.opportunity_id
  join interest_tags it on it.tag_id = ot.tag_id
  cross join k
  group by it.tag_id, it.is_parent
),

o_hat as (
  select
    o.tag_id,
    o.obs / nullif(max(o.obs) over (), 0) as o_hat
    -- ô_v(t): observed interest scaled so the student's most-acted-on tag = 1
  from obs o
),

prior as (
  select
    pi.tag_id
    -- prior_v(t) = 1 for these tags: picked at signup or in settings
  from public.profile_interests pi
  join me on me.profile_id = pi.profile_id
),

w as (
  select
    t.tag_id,
    (k.tau * (case when p.tag_id is not null then 1 else 0 end) + n_v.n * coalesce(o.o_hat, 0))
      / (k.tau + n_v.n) as w
    -- w_v(t) = (τ·prior + n_v·ô) / (τ + n_v): Black–Litterman blend.
    -- New student (n_v = 0) -> exactly the signup picks; very active student -> mostly behaviour
  from (select tag_id from prior union select tag_id from o_hat) t
  left join prior p on p.tag_id = t.tag_id
  left join o_hat o on o.tag_id = t.tag_id
  cross join k
  cross join n_v
),

w_tilde as (
  select
    w.tag_id,
    coalesce(w.w / nullif(max(w.w) over (), 0), 0) as w_tilde
    -- w̃_v(t): interest weight scaled so the student's top interest = 1
  from w
),

-- ===== Candidates: the filter F(v,p) =======================================
cand as (
  select
    o.id,
    -- p: an opportunity that passed every filter below
    o.is_online,
    -- online(p)
    lower(btrim(o.city)) as city,
    -- city(p), normalised for comparison
    coalesce(o.deadline_at, o.starts_at) as due_at
    -- the date urgency counts down to: the deadline, or the start if there is no deadline
  from public.opportunities o
  cross join me
  where o.status = 'published'
    -- only published opportunities
    and (o.deadline_at >= now()
         or (o.deadline_at is null and (o.ends_at is null or o.ends_at >= now())))
    -- not expired: the deadline hasn't passed (or, without a deadline, it hasn't ended)
    and (o.audience = 'both' or o.audience = me.level)
    -- right audience: school students don't see university-only items and vice versa
    and not exists (select 1 from hist_opp h where h.opportunity_id = o.id)
    -- not already saved / competed in
    and (
      me.grade is null
      or not exists (
        select 1
        from public.opportunity_tags ot
        join public.tags t on t.id = ot.tag_id
        where ot.opportunity_id = o.id and t.slug ~ '^grades-[0-9]+-[0-9]+$'
      )
      or exists (
        select 1
        from public.opportunity_tags ot
        join public.tags t on t.id = ot.tag_id
        where ot.opportunity_id = o.id
          and t.slug ~ '^grades-[0-9]+-[0-9]+$'
          and me.grade between split_part(t.slug, '-', 2)::int and split_part(t.slug, '-', 3)::int
      )
    )
    -- right grade: no grades-X-Y tag at all, or the student's grade falls in one of them
),

cand_tags as (
  select
    ot.opportunity_id,
    ot.tag_id
    -- T_p: the topic/format tags of each candidate
  from cand c
  join public.opportunity_tags ot on ot.opportunity_id = c.id
  join interest_tags it on it.tag_id = ot.tag_id
),

hist_tags as (
  select distinct
    ot.opportunity_id,
    ot.tag_id
    -- T_h: the topic/format tags of each history item
  from hist_opp h
  join public.opportunity_tags ot on ot.opportunity_id = h.opportunity_id
  join interest_tags it on it.tag_id = ot.tag_id
),

-- ===== I: interest match ==================================================
i_score as (
  select
    ct.opportunity_id,
    case
      when bool_or(coalesce(wt.w_tilde, 0) >= 1) then 1
      else 1 - exp(sum(ln(greatest(1 - coalesce(wt.w_tilde, 0), 1e-12))))
    end as i
    -- I(v,p) = 1 − Π(1 − w̃(t)): the chance that at least one of its tags matches.
    -- (product written as exp(Σ ln); greatest() avoids ln(0) for a tag with w̃ = 1)
  from cand_tags ct
  left join w_tilde wt on wt.tag_id = ct.tag_id
  group by ct.opportunity_id
),

-- ===== H: history similarity ==============================================
overlap as (
  select
    ct.opportunity_id,
    ht.opportunity_id as hist_id,
    -- one (candidate, history item) pair that share at least one tag
    count(*)::float8 as inter
    -- |T_p ∩ T_h|
  from cand_tags ct
  join hist_tags ht on ht.tag_id = ct.tag_id
  group by ct.opportunity_id, ht.opportunity_id
),

h_score as (
  select
    x.opportunity_id,
    max(x.inter / (cs.size + hs.size - x.inter) * ho.delta) as h
    -- H(v,p) = max over h of Jaccard(T_p, T_h) · δ(h), with Jaccard = |∩| / |∪|
  from overlap x
  join (select opportunity_id, count(*)::float8 as size from cand_tags group by opportunity_id) cs
    on cs.opportunity_id = x.opportunity_id
    -- |T_p|
  join (select opportunity_id, count(*)::float8 as size from hist_tags group by opportunity_id) hs
    on hs.opportunity_id = x.hist_id
    -- |T_h|
  join hist_opp ho on ho.opportunity_id = x.hist_id
  group by x.opportunity_id
),

-- ===== All four parts per candidate =======================================
parts as (
  select
    c.id,
    coalesce(i.i, 0)::float8 as i,
    -- I (0 when the opportunity has no topic/format tags)
    coalesce(h.h, 0)::float8 as h,
    -- H (0 when it shares no tag with anything in the history)
    (case
       when c.is_online or (c.city is not null and c.city = me.city) then 1
       when exists (
         select 1
         from public.opportunity_tags ot
         join public.tags t on t.id = ot.tag_id
         where ot.opportunity_id = c.id and t.slug in ('national', 'international')
       ) then k.l_national_elsewhere
       when c.city is null then k.l_city_unknown
       else 0
     end)::float8 as l,
    -- L(v,p): can the student get there
    (case
       when c.due_at is null then k.u_no_date
       else exp(-greatest(extract(epoch from (c.due_at - now())) / 86400.0, 0)::float8 / k.urgency_days)
     end)::float8 as u
    -- U(p) = e^(−d/κ), d = days left until due_at (0 if it's already under way)
  from cand c
  cross join me
  cross join k
  left join i_score i on i.opportunity_id = c.id
  left join h_score h on h.opportunity_id = c.id
),

rated as (
  select
    p.*,
    k.w_interest * p.i + k.w_history * p.h + k.w_location * p.l + k.w_urgency * p.u as rating
    -- rating(v,p) = 0.50·I + 0.25·H + 0.15·L + 0.10·U
  from parts p
  cross join k
)

select
  r.id,
  round(r.rating::numeric, 3),
  round(r.i::numeric, 3),
  round(r.h::numeric, 3),
  round(r.l::numeric, 3),
  round(r.u::numeric, 3)
from rated r
where r.rating >= p_min_rating
order by r.rating desc, r.id
limit p_limit
$$;

comment on function public.recommended_feed(double precision, integer) is
  'Recommended feed for the logged-in student: one rating 0..1 per eligible opportunity '
  '(0.50·interest + 0.25·history + 0.15·location + 0.10·urgency), highest first. '
  'Algorithm: Niki. See the comments in migration 20261128120100_recommended_feed.sql.';

-- Only signed-in users; for organizers and students without details it just returns nothing.
revoke all on function public.recommended_feed(double precision, integer) from public, anon;
grant execute on function public.recommended_feed(double precision, integer) to authenticated;
