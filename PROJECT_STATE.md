# Shilpi — Project State
_Last updated: 2026-07-19 by Claude Code_

## Current slice
Slice 1 — Lead to listing. **A-01 (sign-up) and A-02 (log in / log out) built and In review.**
**Slice 0 foundation complete, including F-08 — the app is deployed live on Vercel.** Local
Supabase test bed stood up.

## Deployment (F-08)
- **Live:** https://shilpi-bice.vercel.app (Vercel project `shishirendu-shri-s-projects/shilpi`,
  production, verified HTTP 200 — landing renders, Supabase env "configured").
- Deployed via Vercel CLI (`vercel --prod`). `vercel.json` pins `framework: nextjs`.
- Production env vars set on Vercel: `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  point at the **cloud** project.
- **Auto-deploy on push is NOT connected yet** — `vercel git connect` failed because the Vercel
  GitHub App isn't installed on the account. Human action: connect the repo in the Vercel
  dashboard (Project → Settings → Git). Until then, deploy manually with `vercel --prod`.
- **Signup does not work in prod yet** — the cloud project lacks the 002/003/004 migrations and
  has email confirmation on. Landing works; `/signup` needs the cloud DB brought up to date.

## Test suite
**31 passing, 0 failing** (9 files) — was 21 earlier this session, 8 last session.
- Unit: smoke (1), platform/env (4), platform/tenancy (3), signup/validate (6), signup/actions (5),
  login/validate (3), login/actions (4)
- Integration (local Supabase, `@vitest-environment node`): signup provisioning (2) — the real
  002 trigger creates agency + principal user, RLS isolation confirms A can't see B; login/logout
  (3) — sign in with correct creds exposes the session, wrong password rejected, sign out clears it.

Gates: `npm test` green, `npm run build` clean (TypeScript passes), `npm run lint` exit 0 (0 warnings).

## Done this session
- **Local Supabase test bed (Layer 2 mechanics).** `supabase init` → `config.toml`;
  non-essential services disabled (studio, storage, realtime, analytics, edge_runtime) to keep
  the local image set small. `supabase start` runs db + auth + rest + kong. Scripts added:
  `db:start`, `db:stop`, `db:reset`, `db:types`. `.env.test` holds the standard local demo keys
  (public, safe to commit); `vitest.setup.ts` loads it; `src/test/localSupabase.ts` gives
  service + anon test clients.
- **Migrations** (`supabase/migrations/`, replayed cleanly 001→004 via `db reset`, verified):
  - `001_schema.sql` — the base schema (moved verbatim from `shilpi_phase1_schema.sql`).
  - `002_handle_new_user.sql` — Option A signup trigger (SECURITY DEFINER): on new auth user,
    atomically creates the agency + principal `users` row from signup metadata. Keeps the
    service_role key out of the app.
  - `003_grants.sql` — see schema changes below.
  - `004_fix_current_agency_id_recursion.sql` — see schema changes below.
- **A-01 — sign-up creates agency + principal user.** `src/app/(auth)/signup/`:
  `validate.ts` (pure), `actions.ts` (`signUpWithAgency` server action → `supabase.auth.signUp`
  with `full_name`/`agency_name` metadata; the trigger does the provisioning), `page.tsx`
  (useActionState form, styled from the wireframe tokens). Minimal `/dashboard` placeholder as
  the post-signup landing (real shell is A-04). Handles confirmations on/off.
- **A-02 — log in / log out.** `src/app/(auth)/login/` (`validate.ts`, `signIn` action,
  `page.tsx`); `signOut` action + logout button on `/dashboard`; the dashboard now gates to
  `/login` when signed out. **Session persistence** via `src/proxy.ts` (Next 16's renamed
  "middleware" convention) → `platform` `updateSession`, which refreshes the auth token on each
  request. Auth styles shared via `src/app/(auth)/auth.module.css` (signup migrated to it).

## Two latent schema bugs caught by integration testing
Both existed in the original schema and would have bitten later; the live-DB tests surfaced them.
Flagging for the architect.
1. **Missing DML grants (003).** Local `supabase start` did not grant SELECT/INSERT/UPDATE/DELETE
   to anon/authenticated/service_role (a hosted project does this implicitly). Symptom:
   `permission denied for table ...`. Fix: explicit grants — RLS still enforces tenancy; grants
   only decide table reachability. Makes the schema self-contained (local == cloud).
2. **RLS infinite recursion (004).** `current_agency_id()` reads `users`, whose RLS policy calls
   `current_agency_id()` → infinite recursion → `stack depth limit exceeded` (54001) on any
   authenticated query. Fix: make the helper SECURITY DEFINER so it reads `users` without
   re-entering RLS. Tenancy unchanged.

## Decisions made this session
- **A-01 = Option A** (DB trigger, human's choice) — no service_role key in the app.
- **Local dev + tests run against local Supabase.** `.env.local` repointed to
  `http://127.0.0.1:54321` (cloud values kept commented). Production/Vercel will use the cloud
  project's own env (F-08). The 002/003/004 migrations are NOT yet on cloud.
- Trimmed local services in `config.toml` to shrink the Docker pull (dev/test only need
  db/auth/rest/kong).

## Schema changes from the spec
- Restructured single `shilpi_phase1_schema.sql` → `supabase/migrations/001..004`.
- Added `003_grants.sql` and `004_fix_current_agency_id_recursion.sql` (see above). Table
  structure from the data model is unchanged; these are grants + a function-security fix.

## Module boundary notes
- Signup server action lives in the app route (`src/app/(auth)/signup/actions.ts`) and uses
  `@/platform` only. No cross-module table access. Boundaries hold.

## Blockers / open questions
- **db:types deferred** (Layer 3). `supabase gen types --local` spins up a `postgres-meta`
  Docker container whose image won't pull over this machine's flaky egress (it hangs). Not needed
  yet (the client is untyped; tests pass). Pull the image / retry when the network is stable.
- **Cloud parity (now also gates prod signup)**: the cloud project has only the base schema.
  Before signup works on cloud (and on the live Vercel app), apply `002`, `003`, `004` there and
  turn email confirmation OFF for Phase 1 (Auth settings).
- **Vercel Git auto-deploy** — human: connect the repo in the Vercel dashboard (the CLI
  `git connect` needs the Vercel GitHub App installed first).
- The Supabase CLI (`db reset`, `gen types`, `init`) hangs on a telemetry call on this machine
  after doing its work — cosmetic (the DB ends up correct); verified via psql each time.

## Next up
- **A-03** — dedicated RLS isolation test. Largely proven already by A-01/A-02 integration
  tests; A-03 formalizes it across more tables.
- **A-04** — empty dashboard shell after sign-up (replace the `/dashboard` placeholder).
- Human: manual click-through of signup + login/logout to approve A-01/A-02; bring cloud
  Supabase to parity (002/003/004 + confirmation off); connect Vercel Git auto-deploy.
