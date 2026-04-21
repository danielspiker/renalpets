-- RPCs for caregiver/vet linking. Both use SECURITY DEFINER to read
-- auth.users and public.users, which normal clients can't access.

-- Find a user by email, returning their role and name so the tutor can
-- verify before creating a link.
create or replace function public.find_user_for_linking(user_email text)
returns table(id uuid, role public.user_role, full_name text)
language sql
security definer
set search_path = public
stable
as $$
  select u.id, u.role, u.full_name
    from public.users u
    join auth.users au on au.id = u.id
    where lower(au.email) = lower(user_email)
    limit 1;
$$;

-- List all caregivers and vets linked to a cat. Restricted to the tutor
-- via the inline exists() check (tutor_id must match auth.uid()).
create or replace function public.list_cat_access(p_cat_id uuid)
returns table(
  user_id uuid,
  full_name text,
  email text,
  role public.user_role,
  link_type text,
  linked_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    u.id as user_id,
    u.full_name,
    au.email::text,
    u.role,
    'caregiver'::text as link_type,
    cc.granted_at as linked_at
  from public.cat_caregivers cc
  join public.users u on u.id = cc.caregiver_id
  join auth.users au on au.id = u.id
  where cc.cat_id = p_cat_id
    and exists (
      select 1 from public.cats c
      where c.id = p_cat_id and c.tutor_id = auth.uid()
    )
  union all
  select
    u.id as user_id,
    u.full_name,
    au.email::text,
    u.role,
    'vet'::text as link_type,
    cv.linked_at
  from public.cat_vets cv
  join public.users u on u.id = cv.vet_id
  join auth.users au on au.id = u.id
  where cv.cat_id = p_cat_id
    and exists (
      select 1 from public.cats c
      where c.id = p_cat_id and c.tutor_id = auth.uid()
    );
$$;
