-- Trigger: when a new auth.users row is inserted (signup), automatically
-- create the matching public.users profile. Role and full_name come from
-- raw_user_meta_data, which we populate in supabase.auth.signUp({ options }).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, role, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'tutor')::public.user_role,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
