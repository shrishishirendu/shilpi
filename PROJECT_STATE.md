# Shilpi — Project State
_Last updated: 2026-07-20 by Claude Code_

## Current slice
**Slice 2 — Offers: build complete.** The `offers` module (O-01…O-06) is built on top of a
fully-built Slice 1. Submit / counter / accept / reject / withdraw offers on a deal; **accepting
advances the deal stage** — the first real cross-module *call* (offers → deals). Offers live on the
deal detail page.

Slice 1 (Lead to listing) — auth (A-01/A-02/A-04) + `contacts`, `properties`, `deals` — is fully
built and validated end-to-end in prod (live on Vercel). All stories In review; A-03 (RLS) and
D-03 (one contact, two roles, two deals — validates D2) proven by integration tests.

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
**93 passing, 0 failing** (25 files). `offers` adds: validate (3) + `acceptOffer` orchestration
unit (3, mocked — verifies it calls `deals.advanceDealStage` then marks accepted) + offer-actions
unit (4) + repository integration (4, CRUD + status lifecycle + RLS isolation: agency B can't see
or add offers to A's deal). `deals` adds a repository integration test (5) —
**D-01 create at stage 1, D-02 link role, D-03 one contact = vendor on deal 1 + buyer on deal 2
(validates D2), D-04 history-on-create, D-06 advance-writes-history, D-07 append-only (the app
role's delete/update on stage_history is rejected)** — plus action unit tests (4). `properties`
added validate (7) + actions (3) + integration (5); `contacts` validate (6) + actions (5) +
integration (2); auth + platform + component tests as before.
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
- **Migrations** (`supabase/migrations/`, 001→005; replay verified via `db reset`):
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
- **`properties` module (P-01…P-04)** — same shape as contacts (owns `properties`, narrow
  interface, client-injected repository). Fields: address (req) + suburb/postcode/state/type/
  beds/baths/parking/land-size/zoning. UI list (P-02), create (P-01), view/edit (P-03) with a
  `PropertyForm` (type `<select>` + numeric inputs). No Phase-1 search (that's a later slice).
  Sidebar "Properties" is now a live link.
- **`deals` module (D-01…D-08) — the spine.** Owns `deals`, `deal_contacts`, `deal_stages`,
  `stage_history`. `index.ts` orchestrates create/advance and **hydrates board/detail views via
  the `contacts`/`properties` interfaces** (`getContactsByIds`/`getPropertiesByIds` — added to
  those modules) rather than SQL joins; the repository touches only deals' own tables.
  **Migration 005** adds a DB trigger that writes `stage_history` on deal insert (null→1) and on
  every stage change, and revokes write access so it's append-only (D-04/D-06/D-07). UI in
  `src/app/(app)/deals/`: pipeline board (D-05, 13 stage columns, cards show address + primary
  contact), create (D-01), detail (link contacts with roles D-02, advance stage D-06, stage
  history timeline). All server-action forms — no client components. Nav "CRM pipeline" → `/deals`.
- **`offers` module (O-01…O-06) — Slice 2.** Owns `offers`. `submitOffer` (O-01),
  `listOffersForDeal` (O-04, buyer name hydrated via `contacts`), `counter/reject/withdraw` (O-02),
  and `acceptOffer` (O-05) which **advances the deal stage via `deals.advanceDealStage`** — the
  module's one cross-module *call*, and the O-06 boundary case. Conditional offers (finance/B&P)
  via `is_conditional` + `conditions` (O-03). UI is an **Offers section on the deal detail page**
  (list + submit form + per-offer status buttons) — no separate route.

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

## External integrations — Domain API (locked decision · 2026-07-20)
Founder secured **Domain API SANDBOX** access (external track; no code this session). This makes
the Domain listing integration *buildable and testable* against a real sandbox endpoint — but the
**build order is unchanged: Compliance (Slice 3) is still next.** Domain is queued `Ready` (Z-02)
for **after Slice 3** — the 500/day quota isn't going anywhere; don't context-switch to chase it.
- Portal: Domain developer portal · project "Shilpi" · package **"Listings Management – Sandbox"** ·
  Basic data map · **500 calls/day** · Status **Approved**.
- Auth: **OAuth 2.0 Client Credentials** (server-to-server; app-level, not user-delegated — correct
  for a backend data integration; not Authorization Code / Implicit).
- Resources: `listings`, `enquiries`, `agents`, `agencies`, `listingProcessingReports`, `projects`.
  Webhook owner types: `member`, `clientId`, `agency`, `provider`.
- **Secret handling (non-negotiable — same rule as `service_role`):** server-side env var only,
  **NEVER** `NEXT_PUBLIC_`, gitignored, never committed; **all Domain calls backend-only** (never
  from the browser). Honour Domain's caching / attribution / display / rate-limit terms.
- **When built (Z-02 DoD):** Domain behind a **narrow module interface** (no Domain SDK leaking into
  unrelated modules), secret server-side + gitignored (verified), backend-only calls, + a
  boundary/interface test. Production access is a separate later approval.

## Schema changes from the spec
- Restructured single `shilpi_phase1_schema.sql` → `supabase/migrations/001..005`.
- `003_grants.sql` and `004_fix_current_agency_id_recursion.sql` (see above) — grants +
  function-security fix.
- **`005_stage_history.sql`** — `record_stage_change` trigger (auto-writes `stage_history` on
  deal insert + stage change) and `revoke insert/update/delete on stage_history from
  anon, authenticated` (append-only). No table-structure change; this is behaviour the data model
  intended ("stage_history — never updated, only inserted"), now enforced.
- **Cloud parity:** `002`–`005` are ALL applied to cloud now (human ran them). Signup, deals, and
  offers all work in production.

## Module boundary notes
- Signup/login server actions live in the app routes and use `@/platform` only. No cross-module
  table access. Boundaries hold.
- The dashboard's stat cards are now **wired to real counts** via the module interfaces
  (`getDealStats`, `countContacts`, `countProperties`) — active deals + pipeline value + contact /
  property counts. (They were static-zero placeholders until all the modules existed.)
- `platform.getCurrentProfile()` reads `users` + `agencies` — both tenancy tables, which are
  platform's concern (not a domain module). Still no cycles; platform depends on no module.
- **`contacts` sets the module pattern**: it owns `contacts`, depends only on `platform`, and
  exposes a narrow `index.ts`. The app (server actions/pages) imports only `@/modules/contacts`,
  never `internal/*`. `properties` follows the same shape; `deals` will too.
- **Client/server import gotcha (learned building `properties`):** a **Client Component** must not
  import a *value* from a module's `index.ts`, because that barrel pulls in `platform`'s server
  client (`next/headers`) and the build fails. `import type` is fine (erased). Fix: pass such
  values in as props from the server page. (`PropertyForm` gets `PROPERTY_TYPES` as a prop.)
  The build — not the tests — catches this, so `npm run build` stays part of every gate.
- **`deals` respects "no cross-module SQL joins" (rule 3).** It needs property addresses + contact
  names for board/detail, but its repository only queries deals' own four tables (deal_contacts is
  embedded — intra-module). Property/contact data is fetched through the `properties`/`contacts`
  interfaces (`getPropertiesByIds`/`getContactsByIds`) and merged in `index.ts`. Dependency stays
  one-way (deals → contacts/properties); no cycle.
- **`offers` → `deals` is the first cross-module *call*.** `acceptOffer` invokes
  `deals.advanceDealStage` (via the interface, not the tables). `offers` depends on `deals` +
  `contacts`; still one-way (nothing depends back on `offers`), no cycle. Good boundary test (O-06).

## Blockers / open questions
- **db:types deferred** (Layer 3). `supabase gen types --local` spins up a `postgres-meta`
  Docker container whose image won't pull over this machine's flaky egress (it hangs). Not needed
  yet (the client is untyped; tests pass). Pull the image / retry when the network is stable.
- **Cloud is at parity** — migrations `002`–`005` applied, email confirmation off; signup / deals /
  offers all work in prod. Harmless leftover: two `public.handle_new_user` overloads on cloud (one
  trigger fires the right one) — tidy later.
- **Vercel Git auto-deploy — still NOT connected.** A push does not trigger a deploy; I'm running
  `vercel --prod` by hand. Human: connect the repo in the Vercel dashboard (installs the Vercel
  GitHub App). This is part of **F-11**, the immediate pre-Slice-3 priority.
- The Supabase CLI (`db reset`, `gen types`, `init`) hangs on a telemetry call on this machine
  after doing its work — cosmetic (the DB ends up correct); verified via psql each time.

## Next up (order set by the architect, 2026-07-20)
1. **F-11 — CI gate + Vercel Git auto-deploy** (immediate priority, *before* Slice 3). Human
   connects repo→Vercel in the dashboard; add `ci.yml` (setup-cli + `supabase db reset` + the suite)
   so the 94 tests run on every push now that the surface is sizeable.
2. **Slice 3 — Compliance (X-01…X-08)** ⚠️ — deterministic, never-AI, pure functions with the legal
   basis in comments + an audit trail (D3). Time-sensitive (AML Tranche 2 in effect). Build the
   calculators + exhaustive boundary tests, then **STOP for human + solicitor review before
   shipping**. **X-09 (solicitor review) stays `Blocked`** until the founder's legal opinion lands.
3. **Domain integration (Z-02)** — `Ready`, built **AFTER** Slice 3 (sandbox; see the Domain
   decision record above). Don't start it early.
- Human: connect Vercel Git; formally **Approve** the built stories to close Slices 1 & 2.
