-- ============================================================
-- 002_handle_new_user — signup provisioning (decision A-01, Option A)
-- ============================================================
-- When a new auth user is created, atomically create their agency and their
-- principal `users` row.
--
-- Why a SECURITY DEFINER trigger (not app code with the service_role key):
--   A brand-new user has no `users` row yet, so current_agency_id() is null and
--   the RLS policies on `agencies`/`users` would block these inserts. Running as
--   SECURITY DEFINER (as the function owner) lets the provisioning bypass RLS
--   safely inside the database — the service_role key never touches the app.
--
-- How the names arrive:
--   The agency name + full name ride in on the auth signup metadata
--   (auth.users.raw_user_meta_data). The client calls:
--     supabase.auth.signUp({ email, password,
--       options: { data: { full_name, agency_name } } })
--
-- Atomicity:
--   This AFTER INSERT trigger runs in the SAME transaction as the auth user
--   insert. If either insert here fails, the auth user is rolled back too — no
--   orphaned auth users, no half-provisioned agencies.
--
-- `set search_path = ''` hardens the SECURITY DEFINER function against
-- search_path hijacking; every object is therefore fully schema-qualified.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_agency_id uuid;
begin
  -- 1) The agency (the tenant).
  insert into public.agencies (name)
  values (coalesce(nullif(new.raw_user_meta_data->>'agency_name', ''), 'My Agency'))
  returning id into v_agency_id;

  -- 2) The principal user — id mirrors auth.users.id (users.id has no default).
  insert into public.users (id, agency_id, full_name, email, role)
  values (
    new.id,
    v_agency_id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.email, ''),
    'principal'
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
