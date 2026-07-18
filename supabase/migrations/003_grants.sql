-- ============================================================
-- 003_grants — API role privileges
-- ============================================================
-- Supabase's API roles (anon, authenticated, service_role) need table/sequence
-- privileges to reach the tables at all. The RLS policies in 001 are what
-- actually decide which ROWS each role sees — these grants only decide
-- reachability. Tenancy isolation is unchanged (decision D5).
--
-- Why this migration exists: a hosted Supabase project applies these grants
-- automatically via default privileges, but a local `supabase start` does not
-- grant the DML privileges (SELECT/INSERT/UPDATE/DELETE). Without this, even
-- service_role gets "permission denied for table ...". Granting explicitly makes
-- the schema self-contained and makes local behave identically to cloud.
-- ============================================================

grant usage on schema public to anon, authenticated, service_role;

grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;

-- Future tables/sequences/routines created by the migration role inherit these.
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on routines to anon, authenticated, service_role;
