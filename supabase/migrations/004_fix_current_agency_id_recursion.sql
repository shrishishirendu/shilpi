-- ============================================================
-- 004_fix_current_agency_id_recursion
-- ============================================================
-- Integration testing (A-01 RLS) surfaced a latent bug in the
-- current_agency_id() helper from 001. It reads public.users, but `users` has
-- an RLS policy (users_isolation) that itself calls current_agency_id() — so any
-- authenticated query whose policy uses the helper recurses without end:
--
--   agencies policy -> current_agency_id() -> select from users
--     -> users policy -> current_agency_id() -> select from users -> ...
--
-- Postgres aborts with "stack depth limit exceeded" (SQLSTATE 54001).
--
-- Fix: make the helper SECURITY DEFINER so it reads `users` WITHOUT re-entering
-- RLS, breaking the cycle. It still returns only the caller's own agency_id
-- (where id = auth.uid()), so it leaks nothing and tenancy is unchanged — every
-- table's RLS still enforces isolation. `set search_path = ''` hardens the
-- definer function (fully-qualified names).
-- ============================================================

create or replace function public.current_agency_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select agency_id from public.users where id = auth.uid()
$$;
