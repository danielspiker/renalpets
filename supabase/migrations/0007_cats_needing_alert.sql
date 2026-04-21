-- RPC: list cats that haven't been fed in the last N hours.
-- Runs with invoker's privileges, so RLS on `cats` and `meal_logs` applies.
-- The app layer decides whether to call this (tutor + vet yes, caregiver no).
-- Cats with zero meal_logs (brand new) are NOT alerted to avoid noise.

create or replace function public.cats_needing_alert(hours_threshold int default 6)
returns table(
  cat_id uuid,
  cat_name text,
  last_meal_at timestamptz,
  hours_since numeric
)
language sql
stable
as $$
  with last_meals as (
    select cat_id, max(served_at) as last_at
    from public.meal_logs
    where grams_eaten > 0
    group by cat_id
  )
  select
    c.id as cat_id,
    c.name as cat_name,
    lm.last_at as last_meal_at,
    round(
      (extract(epoch from (now() - lm.last_at)) / 3600)::numeric,
      1
    ) as hours_since
  from public.cats c
  join last_meals lm on lm.cat_id = c.id
  where lm.last_at < now() - (hours_threshold || ' hours')::interval
  order by lm.last_at asc;
$$;
