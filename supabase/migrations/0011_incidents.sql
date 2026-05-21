-- Incidents: clinical events the tutor / caregiver logs throughout the day.
-- Examples: vomiting, constipation, sub-q fluids, vet visit.
-- The vet reads incidents alongside meal_logs to assess the cat.

create type public.incident_type as enum (
  -- GI
  'vomit_with_food',
  'vomit_without_food',
  'hairball',
  'diarrhea',
  'blood_in_stool',
  'constipation',
  'food_refusal',
  -- Urinary
  'hematuria',
  'polyuria',
  'polydipsia',
  'litter_box_miss',
  -- Systemic
  'lethargy',
  'tremor_seizure',
  'dyspnea',
  'pain_vocalization',
  'acute_event',
  -- Management
  'subq_fluids',
  'medication',
  'exam_sample',
  'vet_visit',
  -- Catch-all
  'other'
);

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  cat_id uuid not null references public.cats(id) on delete cascade,
  logged_by uuid not null references public.users(id),
  type public.incident_type not null,
  occurred_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

create index incidents_cat_occurred_idx
  on public.incidents (cat_id, occurred_at desc);

alter table public.incidents enable row level security;

-- Anyone with access to the cat (tutor, caregiver, vet) can read incidents.
create policy "incidents_select_access" on public.incidents
  for select using (public.user_can_access_cat(cat_id));

-- Only tutor or caregiver can insert / update / delete incidents.
-- Vet is read-only (mirrors meal_logs policy from 0006).
create policy "incidents_insert_tutor_caregiver" on public.incidents
  for insert with check (
    logged_by = auth.uid()
    and public.user_can_access_cat(cat_id)
    and exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('tutor', 'caregiver')
    )
  );

create policy "incidents_update_tutor_caregiver" on public.incidents
  for update using (
    logged_by = auth.uid()
    and exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('tutor', 'caregiver')
    )
  )
  with check (
    logged_by = auth.uid()
    and public.user_can_access_cat(cat_id)
  );

create policy "incidents_delete_tutor_caregiver" on public.incidents
  for delete using (
    logged_by = auth.uid()
    and exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('tutor', 'caregiver')
    )
  );

-- Broadcast new incidents in realtime so vet dashboard can react.
alter publication supabase_realtime add table public.incidents;
