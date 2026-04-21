-- RenalPets — initial schema
-- Tables, enums, indexes, RLS policies, and daily_progress trigger

-- =====================================================
-- ENUMS
-- =====================================================
create type public.user_role as enum ('tutor', 'caregiver', 'vet');

-- =====================================================
-- TABLES
-- =====================================================

-- Profile data linked to auth.users
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null,
  full_name text not null,
  created_at timestamptz not null default now()
);

create table public.cats (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  birthdate date,
  weight_kg numeric(5,2),
  photo_url text,
  created_at timestamptz not null default now()
);

create table public.cat_caregivers (
  cat_id uuid not null references public.cats(id) on delete cascade,
  caregiver_id uuid not null references public.users(id) on delete cascade,
  granted_at timestamptz not null default now(),
  primary key (cat_id, caregiver_id)
);

create table public.cat_vets (
  cat_id uuid not null references public.cats(id) on delete cascade,
  vet_id uuid not null references public.users(id) on delete cascade,
  linked_at timestamptz not null default now(),
  primary key (cat_id, vet_id)
);

create table public.diet_protocols (
  id uuid primary key default gen_random_uuid(),
  cat_id uuid not null references public.cats(id) on delete cascade,
  vet_id uuid not null references public.users(id),
  daily_goal_grams numeric(6,2) not null,
  notes text,
  starts_on date not null default current_date,
  ends_on date,
  created_at timestamptz not null default now()
);

create table public.meal_schedules (
  id uuid primary key default gen_random_uuid(),
  cat_id uuid not null references public.cats(id) on delete cascade,
  time_of_day time not null,
  grams numeric(6,2) not null,
  created_at timestamptz not null default now()
);

create table public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  cat_id uuid not null references public.cats(id) on delete cascade,
  logged_by uuid not null references public.users(id),
  served_at timestamptz not null default now(),
  grams_served numeric(6,2) not null,
  grams_eaten numeric(6,2) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table public.daily_progress (
  cat_id uuid not null references public.cats(id) on delete cascade,
  day date not null,
  goal_grams numeric(6,2) not null,
  eaten_grams numeric(6,2) not null default 0,
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (cat_id, day)
);

create table public.feeding_tips (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

-- =====================================================
-- INDEXES
-- =====================================================
create index on public.meal_logs (cat_id, served_at desc);
create index on public.meal_schedules (cat_id);
create index on public.diet_protocols (cat_id);
create index on public.cats (tutor_id);

-- =====================================================
-- HELPER FUNCTION (used by RLS policies)
-- =====================================================
create or replace function public.user_can_access_cat(cat uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    exists (select 1 from public.cats c where c.id = cat and c.tutor_id = auth.uid())
    or exists (select 1 from public.cat_caregivers cc where cc.cat_id = cat and cc.caregiver_id = auth.uid())
    or exists (select 1 from public.cat_vets cv where cv.cat_id = cat and cv.vet_id = auth.uid());
$$;

-- =====================================================
-- ENABLE RLS
-- =====================================================
alter table public.users enable row level security;
alter table public.cats enable row level security;
alter table public.cat_caregivers enable row level security;
alter table public.cat_vets enable row level security;
alter table public.diet_protocols enable row level security;
alter table public.meal_schedules enable row level security;
alter table public.meal_logs enable row level security;
alter table public.daily_progress enable row level security;
alter table public.feeding_tips enable row level security;

-- =====================================================
-- POLICIES
-- =====================================================

-- users: read/insert/update own profile
create policy "users_select_self" on public.users
  for select using (id = auth.uid());
create policy "users_insert_self" on public.users
  for insert with check (id = auth.uid());
create policy "users_update_self" on public.users
  for update using (id = auth.uid());

-- cats: accessible users read; only tutor writes
create policy "cats_select" on public.cats
  for select using (public.user_can_access_cat(id));
create policy "cats_insert" on public.cats
  for insert with check (tutor_id = auth.uid());
create policy "cats_update" on public.cats
  for update using (tutor_id = auth.uid());
create policy "cats_delete" on public.cats
  for delete using (tutor_id = auth.uid());

-- cat_caregivers: tutor manages, caregiver sees own
create policy "caregivers_select" on public.cat_caregivers
  for select using (
    caregiver_id = auth.uid()
    or exists (select 1 from public.cats c where c.id = cat_id and c.tutor_id = auth.uid())
  );
create policy "caregivers_insert" on public.cat_caregivers
  for insert with check (
    exists (select 1 from public.cats c where c.id = cat_id and c.tutor_id = auth.uid())
  );
create policy "caregivers_delete" on public.cat_caregivers
  for delete using (
    exists (select 1 from public.cats c where c.id = cat_id and c.tutor_id = auth.uid())
  );

-- cat_vets: tutor manages, vet sees own
create policy "vets_select" on public.cat_vets
  for select using (
    vet_id = auth.uid()
    or exists (select 1 from public.cats c where c.id = cat_id and c.tutor_id = auth.uid())
  );
create policy "vets_insert" on public.cat_vets
  for insert with check (
    exists (select 1 from public.cats c where c.id = cat_id and c.tutor_id = auth.uid())
  );
create policy "vets_delete" on public.cat_vets
  for delete using (
    exists (select 1 from public.cats c where c.id = cat_id and c.tutor_id = auth.uid())
  );

-- diet_protocols: accessible users read; only linked vet writes
create policy "protocols_select" on public.diet_protocols
  for select using (public.user_can_access_cat(cat_id));
create policy "protocols_insert" on public.diet_protocols
  for insert with check (
    vet_id = auth.uid()
    and exists (select 1 from public.cat_vets cv where cv.cat_id = diet_protocols.cat_id and cv.vet_id = auth.uid())
  );
create policy "protocols_update" on public.diet_protocols
  for update using (vet_id = auth.uid());

-- meal_schedules: accessible users read; only tutor writes
create policy "schedules_select" on public.meal_schedules
  for select using (public.user_can_access_cat(cat_id));
create policy "schedules_insert" on public.meal_schedules
  for insert with check (
    exists (select 1 from public.cats c where c.id = cat_id and c.tutor_id = auth.uid())
  );
create policy "schedules_update" on public.meal_schedules
  for update using (
    exists (select 1 from public.cats c where c.id = cat_id and c.tutor_id = auth.uid())
  );
create policy "schedules_delete" on public.meal_schedules
  for delete using (
    exists (select 1 from public.cats c where c.id = cat_id and c.tutor_id = auth.uid())
  );

-- meal_logs: accessible users read; tutor/caregiver/vet can log
create policy "logs_select" on public.meal_logs
  for select using (public.user_can_access_cat(cat_id));
create policy "logs_insert" on public.meal_logs
  for insert with check (
    logged_by = auth.uid() and public.user_can_access_cat(cat_id)
  );
create policy "logs_update" on public.meal_logs
  for update using (logged_by = auth.uid());

-- daily_progress: read-only for users with access (populated by trigger)
create policy "progress_select" on public.daily_progress
  for select using (public.user_can_access_cat(cat_id));

-- feeding_tips: readable by any authenticated user
create policy "tips_select_all" on public.feeding_tips
  for select using (auth.role() = 'authenticated');

-- =====================================================
-- DAILY PROGRESS TRIGGER
-- Recalculates daily_progress whenever meal_logs change.
-- SECURITY DEFINER so it can write to daily_progress bypassing RLS.
-- =====================================================
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

create trigger trg_meal_logs_recalc_progress
  after insert or update or delete on public.meal_logs
  for each row execute function public.recalc_daily_progress();

-- =====================================================
-- REALTIME
-- Broadcast daily_progress updates to tutor + caregivers + vet
-- =====================================================
alter publication supabase_realtime add table public.daily_progress;
alter publication supabase_realtime add table public.meal_logs;
