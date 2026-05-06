-- Fix: when a cat is deleted, the cascade removes meal_logs which fires
-- recalc_daily_progress AFTER trigger. The trigger then tries to UPSERT a
-- daily_progress row referencing the cat being deleted in the same statement,
-- producing:
--   insert or update on table "daily_progress" violates foreign key constraint
--   "daily_progress_cat_id_fkey"
--
-- Solution: skip the recalc if the parent cat no longer exists.

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

  -- Skip when the cat is being deleted in the same statement (cascade delete).
  if not exists (select 1 from public.cats where id = target_cat) then
    return coalesce(new, old);
  end if;

  target_day := (coalesce(new.served_at, old.served_at))::date;

  select coalesce(dp.daily_goal_grams, 0)
    into goal
    from public.diet_protocols dp
    where dp.cat_id = target_cat
      and dp.starts_on <= target_day
      and (dp.ends_on is null or dp.ends_on >= target_day)
    order by dp.starts_on desc
    limit 1;

  select coalesce(sum(ml.grams_eaten), 0)
    into eaten
    from public.meal_logs ml
    where ml.cat_id = target_cat
      and ml.served_at::date = target_day;

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
