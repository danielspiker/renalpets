-- Tighten meal_logs INSERT policy: only tutor and caregiver can register
-- meals. Vet has read-only access (for monitoring) and prescribes diet
-- protocols, but does not perform day-to-day meal registration.

drop policy if exists "logs_insert" on public.meal_logs;

create policy "logs_insert" on public.meal_logs
  for insert with check (
    logged_by = auth.uid()
    and (
      exists (
        select 1 from public.cats c
        where c.id = meal_logs.cat_id and c.tutor_id = auth.uid()
      )
      or exists (
        select 1 from public.cat_caregivers cc
        where cc.cat_id = meal_logs.cat_id and cc.caregiver_id = auth.uid()
      )
    )
  );
