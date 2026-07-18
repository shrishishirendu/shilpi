# Shilpi — Project State
_Last updated: 2026-07-18 by Claude Code_

## Current slice
Slice 0 — Foundation. F-03, F-04, F-05, F-06, F-07 done. F-01/F-02 (Supabase) and
F-08 (Vercel) remain — both need the human.

## Test suite
**8 passing, 0 failing** (3 files) — was 0/0 last session.
- `src/__tests__/smoke.test.ts` — framework sanity (F-05)
- `src/platform/__tests__/env.test.ts` — Supabase env helper (4)
- `src/platform/__tests__/tenancy.test.ts` — tenancy resolver logic (3)

Gates: `npm run build` clean (TypeScript passes), `npm run lint` exit 0, `npm test` green.

## Done
- Git repo + remote `origin` (https://github.com/shrishishirendu/shilpi), branch `main`.
- **F-04** — module folder layout per §4.2, each with a README boundary contract.
- **F-07** — this file.
- **F-03** — Next.js app scaffolded (App Router + TypeScript), builds and prerenders.
  Design tokens from the wireframe ported into `src/app/globals.css`. Foundation landing
  page reports Supabase config status. `.env.example` + gitignored `.env.local`.
- **F-05** — Vitest installed with one trivial passing test, before any feature code.
- **F-06** — `platform` module built: Supabase server + browser clients (`@supabase/ssr`),
  `getCurrentUser` auth helper, `getCurrentAgencyId` tenancy resolver (mirrors the
  `current_agency_id()` SQL helper). Public server interface at `@/platform`.

## Stack as installed
- Next.js 16.2 (App Router, Turbopack), React 19.2, TypeScript 6.
- Supabase: `@supabase/supabase-js` 2.x, `@supabase/ssr` 0.12.
- Vitest 4 + Testing Library + jsdom. ESLint 9 (flat config) + eslint-config-next.
- npm (no pnpm/yarn on this machine). Node 24.14.

## Decisions made this session
- Test runner: **Vitest** (human choice). Styling: **port the wireframe's plain CSS**
  (CSS variables + CSS Modules), no Tailwind (human choice). Supabase: **scaffold
  app-first, wire credentials later** (human choice).
- Scaffolded Next.js **manually** (not `create-next-app`) to preserve the existing `/src`
  module structure.
- `create-next-app`'s default ESLint (`FlatCompat` + `eslint-config-next`) crashed with a
  circular-reference error on ESLint 9 / Next 16. Fixed by using eslint-config-next's
  **direct flat-config export** (`import next from "eslint-config-next"`). `next lint` is
  removed in Next 16, so the lint script is now `eslint .`.
- Next 16 dropped the `eslint` key in `next.config.mjs` and no longer runs ESLint during
  `next build`; removed that config block. Lint is a separate gate now.

## Blockers / open questions
- **F-01/F-02** (create Supabase project in `ap-southeast-2`; run
  `supabase/shilpi_phase1_schema.sql`; verify 13 stages seeded) — human action. Until then
  `.env.local` is empty and any real Supabase call throws the "not configured" error by
  design. The app still builds, runs, and tests pass.
- **F-08** (Vercel deploy) — needs the human's Vercel account.

## Schema changes from the spec
- None.

## Module boundary notes
- `platform` has a **browser/server split**: `@/platform` (index.ts) is the server
  interface and pulls in `next/headers`; Client Components must import the browser client
  from `@/platform/supabase/browser` instead. This is the one sanctioned exception to
  "import only from index.ts" — documented in `src/platform/README.md`.
- `platform` depends on no module, as required. No cycles.

## Next up
1. **F-01/F-02** — human creates the Supabase project + runs the schema; then paste
   URL + anon key into `.env.local` and I verify a real connection (13 stages seeded).
2. **F-08** — deploy the empty app to Vercel to prove the pipeline early.
3. Then **Slice 1** starts with **A-01** (sign-up creates agency + principal user) — the
   first feature code, and the first real use of the `platform` auth/tenancy helpers.
