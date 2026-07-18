# Shilpi — Project State
_Last updated: 2026-07-18 by Claude Code_

## Current slice
Slice 0 — Foundation (F-01 … F-08).

## Done
- Git repository initialised in the repo root. Remote `origin` →
  `https://github.com/shrishishirendu/shilpi` (reachable, currently **empty** — nothing
  pushed yet). Default branch renamed `master` → `main`.
- **F-04 — module folder structure created per requirements §4.2.**
  `/src/modules/{contacts,properties,deals,compliance,offers,ai}`, `/src/contracts`,
  `/src/platform`. Each folder carries a `README.md` stating its boundary contract
  (owns tables / depends on / never touches), plus `/src/README.md` restating the §4.3 rules.
- **F-07 — this file created in the repo root.**
- Added a standard Node/Next.js `.gitignore`.

## In progress
- Nothing half-built — scaffolding only, no application code yet.

## Decisions made this session
- Read "check this layout" as the §4.2 module map (the wireframe is the *visual* spec, not a
  folder layout).
- Created the module folders as **documentation-only READMEs**, not `.ts` code — there is no
  Next.js app / `tsconfig` to compile against yet. Each module's public interface
  (`index.ts`) and internals will be added with their own Slice 1 stories, so we don't build
  ahead of the current slice (D9).
- Did **not** scaffold Next.js or install a test framework (F-03 / F-05): both add libraries,
  which the requirements say to clear with the human first (§3, §10). Awaiting go-ahead.

## Blockers / open questions
- **F-01 / F-02** (create the Supabase project in `ap-southeast-2`; run
  `supabase/shilpi_phase1_schema.sql`) need the human — these can't be done from here.
- **F-03 / F-05 / F-06** not started — waiting on approval to scaffold Next.js + a test
  framework before writing any feature code.

## Schema changes from the spec
- None.

## Module boundary notes
- None strained yet — no code written.

## Next up
1. **F-03** — scaffold the Next.js app (App Router + TypeScript) that connects to Supabase.
2. **F-05** — install a test framework; get one trivial test passing *before* any feature
   code.
3. **F-06** — build the `platform` module (DB client, auth helper, tenancy resolver).
4. **F-08** — deploy the empty app to Vercel to prove the pipeline early.
5. Then Slice 1 — Auth & tenancy (A-01 …).
