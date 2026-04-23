-- Align all date boundaries with the app's operational timezone (America/Sao_Paulo).
-- Without this, `timestamptz::date` uses UTC, so meals logged after 21h BRT land in
-- the next UTC day — daily_progress rows are stored under the wrong day and the
-- dashboard's "today" query returns no rows between ~21h-00h BRT.

alter database postgres set timezone = 'America/Sao_Paulo';

create or replace function public.recalc_daily_progress()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_cat uuid;
  target_day date;
  goal numeric(6,2);
  eaten numeric(6,2);
begin
  target_cat := coalesce(new.cat_id, old.cat_id);
  target_day := (coalesce(new.served_at, old.served_at) at time zone 'America/Sao_Paulo')::date;

  -- Priority 1: active diet_protocol from the vet
  select dp.daily_goal_grams
    into goal
    from public.diet_protocols dp
    where dp.cat_id = target_cat
      and dp.starts_on <= target_day
      and (dp.ends_on is null or dp.ends_on >= target_day)
    order by dp.starts_on desc
    limit 1;

  -- Priority 2 (fallback): sum of meal_schedules defined by the tutor
  if goal is null then
    select coalesce(sum(ms.grams), 0)
      into goal
      from public.meal_schedules ms
      where ms.cat_id = target_cat;
  end if;

  select coalesce(sum(ml.grams_eaten), 0)
    into eaten
    from public.meal_logs ml
    where ml.cat_id = target_cat
      and (ml.served_at at time zone 'America/Sao_Paulo')::date = target_day;

  insert into public.daily_progress (cat_id, day, goal_grams, eaten_grams, completed, updated_at)
  values (
    target_cat,
    target_day,
    coalesce(goal, 0),
    eaten,
    coalesce(goal, 0) > 0 and eaten >= coalesce(goal, 0),
    now()
  )
  on conflict (cat_id, day) do update
    set goal_grams = excluded.goal_grams,
        eaten_grams = excluded.eaten_grams,
        completed = excluded.completed,
        updated_at = now();

  return coalesce(new, old);
end;
$$;

-- Rebuild historical daily_progress rows using the corrected timezone boundary.
with recomputed as (
  select
    ml.cat_id,
    (ml.served_at at time zone 'America/Sao_Paulo')::date as day,
    sum(ml.grams_eaten) as eaten
  from public.meal_logs ml
  group by ml.cat_id, (ml.served_at at time zone 'America/Sao_Paulo')::date
),
with_goal as (
  select
    r.cat_id,
    r.day,
    r.eaten,
    coalesce(
      (
        select dp.daily_goal_grams
        from public.diet_protocols dp
        where dp.cat_id = r.cat_id
          and dp.starts_on <= r.day
          and (dp.ends_on is null or dp.ends_on >= r.day)
        order by dp.starts_on desc
        limit 1
      ),
      (
        select coalesce(sum(ms.grams), 0)
        from public.meal_schedules ms
        where ms.cat_id = r.cat_id
      ),
      0
    ) as goal
  from recomputed r
)
insert into public.daily_progress (cat_id, day, goal_grams, eaten_grams, completed, updated_at)
select
  cat_id,
  day,
  goal,
  eaten,
  goal > 0 and eaten >= goal,
  now()
from with_goal
on conflict (cat_id, day) do update
  set goal_grams = excluded.goal_grams,
      eaten_grams = excluded.eaten_grams,
      completed = excluded.completed,
      updated_at = now();
