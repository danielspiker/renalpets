-- Link meal logs back to the schedule that was fulfilled (nullable for ad-hoc meals)

alter table public.meal_logs
  add column schedule_id uuid references public.meal_schedules(id) on delete set null;

create index meal_logs_schedule_idx on public.meal_logs(schedule_id, served_at);
