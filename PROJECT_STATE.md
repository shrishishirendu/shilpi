# Shilpi — Project State
_Last updated: 2026-07-19 by Claude Code_

## Current slice
Slice 1 — Lead to listing. Auth block **(A-01 sign-up, A-02 log in/out, A-04 dashboard shell)**
and the **`contacts` module (C-01…C-05)** built and In review. (A-03 RLS isolation is proven by
integration tests.) **Slice 0 foundation complete, including F-08 — the app is deployed live on
Vercel.** Local Supabase test bed stood up.

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
**53 passing, 0 failing** (16 files).
- Unit: smoke, platform/env (4), platform/tenancy (3), platform/profile (4), signup/validate (6),
  signup/actions (5), login/validate (3), login/actions (4), contacts/validate (5),
  contacts/actions (3).
- Component (Testing Library): Sidebar (2), dashboard empty state (1).
- Integration (local Supabase, `@vitest-environment node`): signup provisioning (2); login/logout
  (3); profile query (1); **contacts repository (6)** — CRUD + RLS isolation across two agencies,
  including "can't create a contact for another agency" (RLS WITH CHECK).

Runtime-verified earlier: dev server serves `/`, `/login`, `/signup` (200); unauthenticated
`/dashboard` 307-redirects to `/login` (the `(app)` shell auth gate, which also guards `/contacts`).

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
- **A-04 — dashboard shell.** New `(app)` route group with a shared `layout.tsx` (the auth gate
  for all app pages: no session → `/login`) rendering the wireframe shell — navy `Sidebar`
  (client; nav with active state, "Soon" placeholders for unbuilt routes, user footer + logout)
  and topbar. `/dashboard` now shows a real **empty state** (zeroed stat cards + "workspace is
  ready" panel). `platform.getCurrentProfile()` added (user + role + agency name via a `users` →
  `agencies` embed). Phase-2 wireframe items (AI agents, DTO, mode toggle) intentionally omitted.
- **`contacts` module (C-01…C-05)** — the first real domain module. Owns the `contacts` table
  behind a narrow public interface (`src/modules/contacts/index.ts`: create/list/search/get/update
  + `validateContact` + types). Internals in `internal/{types,validate,repository}.ts`; the
  repository takes the Supabase client as a param (testable), `index.ts` wires it to platform.
  UI in `src/app/(app)/contacts/` — list + name search (C-02/C-03), create (C-01), view/edit
  (C-04). Sidebar "Contacts" is now a live link.

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
- Signup/login server actions live in the app routes and use `@/platform` only. No cross-module
  table access. Boundaries hold.
- The dashboard's stat cards are **static zeros**, not queried — the domain tables
  (deals/contacts/properties) are owned by modules that don't exist yet, so we deliberately don't
  reach into them. They get wired to real counts via those modules' interfaces later.
- `platform.getCurrentProfile()` reads `users` + `agencies` — both tenancy tables, which are
  platform's concern (not a domain module). Still no cycles; platform depends on no module.
- **`contacts` sets the module pattern**: it owns `contacts`, depends only on `platform`, and
  exposes a narrow `index.ts`. The app (server actions/pages) imports only `@/modules/contacts`,
  never `internal/*`. `properties` and `deals` will follow the same shape.

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
- **`properties` module (P-01…P-04)** — same shape as `contacts`: create / list / view / edit,
  narrow interface. Then **`deals`** (D-01…) — the spine that ties contacts + properties together.
- **A-03** — formalize RLS isolation as its own test (already largely proven).
- Human: manual click-through to approve A-01/A-02/A-04 and the contacts CRUD (sign up → add /
  search / edit a contact); bring cloud Supabase to parity (002/003/004 + confirmation off);
  connect Vercel Git auto-deploy.
