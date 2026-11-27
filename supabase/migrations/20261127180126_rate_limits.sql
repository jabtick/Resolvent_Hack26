-- Rate limiting for Edge Functions (owner: Bogi, security).
-- Lives in its own `private` schema, which is NOT exposed through the API,
-- so it does not touch the app tables owned by Gosho and Niki.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.rate_limits (
  key          text        not null,
  window_start timestamptz not null,
  count        integer     not null default 1,
  primary key (key, window_start)
);

alter table private.rate_limits enable row level security;
-- No policies on purpose: only the service role (Edge Functions) reaches it.

-- Fixed-window counter. Returns true while the caller is within the limit.
-- Called from Edge Functions via adminClient().rpc('check_rate_limit', ...).
create or replace function public.check_rate_limit(
  p_key            text,
  p_limit          integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window timestamptz;
  v_count  integer;
begin
  if p_limit < 1 or p_window_seconds < 1 then
    raise exception 'invalid rate limit arguments';
  end if;

  v_window := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into private.rate_limits as rl (key, window_start, count)
  values (p_key, v_window, 1)
  on conflict (key, window_start)
  do update set count = rl.count + 1
  returning rl.count into v_count;

  -- Occasionally drop old windows so the table stays small.
  if random() < 0.01 then
    delete from private.rate_limits
    where window_start < now() - interval '1 day';
  end if;

  return v_count <= p_limit;
end;
$$;

-- Only the service role may call it; clients must not be able to reset or probe limits.
revoke execute on function public.check_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, integer, integer)
  to service_role;
