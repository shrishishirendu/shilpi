# Shilpi — Backlog

**Owner:** the human (product owner). **Maintainer:** Claude Code updates status; the human approves moves into `Approved` and `Deployed`.
**Companion file:** `PROJECT_STATE.md` (session-by-session narrative). This file is the durable inventory.

---

## Workflow states

| State | Meaning | Who moves it |
|---|---|---|
| `Backlog` | Known, not scoped for build yet | Human |
| `Ready` | Scoped, acceptance criteria written, no blockers | Human |
| `In progress` | Being built this session | Claude Code |
| `In review` | Built, tests green, awaiting human check | Claude Code |
| `Approved` | Human has verified it works as specified | **Human only** |
| `Deployed` | Live on Vercel/Supabase | Human |
| `Blocked` | Needs a decision or external dependency | Anyone |

**Rule:** Claude Code may move a story to `In review` but **never** to `Approved`. Approval is a human act.

---

## Definition of done (applies to EVERY story)

A story is not `In review` until all of these are true:

- [ ] Acceptance criteria met, all of them
- [ ] **Automated tests written and passing** — unit tests for logic, integration test for the happy path
- [ ] **Full test suite green** — not just the new tests; nothing regressed
- [ ] RLS verified where the story touches data — a second agency cannot see this data
- [ ] Module boundaries respected — no cross-module table access, no cycles
- [ ] Matches the wireframe where the story has UI
- [ ] No schema drift — or drift logged in `PROJECT_STATE.md` with reason
- [ ] `PROJECT_STATE.md` updated

If any box is unchecked, the story stays `In progress`. Do not mark it done and move on.

---

## Regression discipline (read this every session)

The single biggest risk in a multi-session build is silently breaking something that worked three sessions ago.

**Every session, before writing new code:**
1. Run the full test suite. Record the result in `PROJECT_STATE.md`.
2. If anything is red that was green — stop. Fix it before new work.

**Every session, before finishing:**
1. Run the full suite again. Record pass/fail counts.
2. Note in `PROJECT_STATE.md`: *"Suite: N passing, N failing (was N/N last session)"*.

This number is what the human brings back to the architect chat. It's the honest health signal — a rising failure count means we stop adding features and fix.

---

## SLICE 0 — Foundation

| ID | Story | State | Notes |
|---|---|---|---|
| F-01 | Supabase project created, Sydney region (`ap-southeast-2`) | `Ready` | Human does this with Claude Code |
| F-02 | Run `shilpi_phase1_schema.sql` — all 12 tables + seed + RLS | `Ready` | Verify 13 stages seeded |
| F-03 | Next.js app scaffolded, connects to Supabase | `Ready` | |
| F-04 | Module folder structure created per requirements §4.2 | `Ready` | `/modules`, `/contracts`, `/platform` |
| F-05 | Test framework installed and running (one trivial passing test) | `Ready` | **Do this before any feature code** |
| F-06 | `platform` module: db client, auth helper, tenancy resolver | `Ready` | The only global |
| F-07 | `PROJECT_STATE.md` created in repo root | `Ready` | Template in requirements §9 |
| F-08 | Deploy pipeline to Vercel — empty app live | `Backlog` | Prove the pipeline early |

**Slice 0 done when:** schema is live, app connects, one test passes, empty app deploys.

---

## SLICE 1 — Lead to listing (stages 1–4)

### Auth & tenancy

| ID | Story | State | Acceptance criteria |
|---|---|---|---|
| A-01 | Sign-up creates agency + principal user | `Ready` | Form: name, email, password, agency name → creates `auth.users` + one `agencies` row + one `users` row (`role='principal'`, id matches auth id) |
| A-02 | Log in / log out | `Ready` | Session persists; logout clears it |
| A-03 | **RLS isolation verified** | `Ready` | Create 2 agencies. Agency B cannot read *any* of agency A's rows. Test this as an automated test, not by eye. |
| A-04 | Empty dashboard after sign-up | `Ready` | Lands on dashboard shell, no data, no errors |

### `contacts` module

| ID | Story | State | Acceptance criteria |
|---|---|---|---|
| C-01 | Create a contact | `Ready` | Name required; email, phone, address, notes optional. Saved with `agency_id`. **No role field on the contact.** |
| C-02 | List contacts | `Ready` | Shows agency's contacts only |
| C-03 | Search contacts by name | `Ready` | Partial match |
| C-04 | View / edit a contact | `Ready` | Update persists |
| C-05 | Contact module exposes a narrow interface | `Ready` | `/modules/contacts/index.ts` exports only what other modules need. No table access from outside. |

### `properties` module

| ID | Story | State | Acceptance criteria |
|---|---|---|---|
| P-01 | Create a property | `Ready` | Address required; suburb, postcode, type, beds, baths, parking, land size, zoning optional |
| P-02 | List properties | `Ready` | Agency-scoped |
| P-03 | View / edit a property | `Ready` | |
| P-04 | Property module interface | `Ready` | Same rule as C-05 |

### `deals` module

| ID | Story | State | Acceptance criteria |
|---|---|---|---|
| D-01 | Create a deal | `Ready` | Starts `current_stage=1`, `status='active'`, `mode='agent'`. Property optional at creation. |
| D-02 | Link a contact to a deal with a role | `Ready` | Writes `deal_contacts` with role `buyer`/`vendor`. |
| D-03 | **One contact, two roles, two deals** | `Ready` | **This validates decision D2.** Same contact is `vendor` on deal 1 and `buyer` on deal 2. Both render correctly. Automated test required. |
| D-04 | Initial stage history row | `Ready` | On deal creation, write `stage_history` (from `null` → 1) |
| D-05 | Pipeline board renders | `Ready` | Columns from `deal_stages`, at least stages 1–4. Cards show address + primary contact. Matches wireframe. |
| D-06 | Advance a deal to next stage | `Ready` | Updates `deals.current_stage`, writes `stage_history` (from, to, changed_by, changed_at) |
| D-07 | Stage history is append-only | `Ready` | No update or delete path exists. Test that history survives a stage move back and forth. |
| D-08 | Deals module interface | `Ready` | Exports what `offers`/`compliance` will need later |

### Slice 1 exit criteria

- [ ] All stories above `Approved`
- [ ] Full suite green
- [ ] D-03 proves the unified-contacts decision works end to end
- [ ] A-03 proves tenancy isolation
- [ ] Human has clicked through the whole flow manually once
- [ ] Deployed to Vercel

---

## SLICE 2 — Offers (stages 5–6) · `Backlog`

| ID | Story | State |
|---|---|---|
| O-01 | Submit an offer against a deal | `Backlog` |
| O-02 | Offer statuses: submitted → countered → accepted/rejected/withdrawn | `Backlog` |
| O-03 | Conditional offers (finance, B&P) with conditions text | `Backlog` |
| O-04 | Offers list per deal, matching wireframe | `Backlog` |
| O-05 | Accepting an offer advances the deal stage | `Backlog` |
| O-06 | `offers` module interface + boundary test | `Backlog` |

---

## SLICE 3 — Compliance gates (stages 7–9) · `Backlog` ⚠️

> **This slice requires human + solicitor verification of the LOGIC, not just passing tests.**
> Nothing here ships without the human explicitly signing off on the legal correctness.

| ID | Story | State | Notes |
|---|---|---|---|
| X-01 | NSW public holiday calendar as data | `Backlog` | Not hardcoded. Needed for business-day maths. |
| X-02 | Cooling-off calculator — pure function | `Backlog` | 5 business days, excludes NSW public holidays. **Comment the legal basis.** Unit tests for edge cases (holidays, weekends, year boundary). |
| X-03 | Stamp duty calculator — pure function | `Backlog` | NSW brackets + FHB concessions. **Comment the legal basis.** Test every bracket boundary. |
| X-04 | Finance clause deadline tracking | `Backlog` | |
| X-05 | `compliance_items` CRUD | `Backlog` | |
| X-06 | Stage gate: block advance when a blocking item is unclear | `Backlog` | The seam left in D-06 |
| X-07 | Immutable audit trail on every calculation | `Backlog` | |
| X-08 | Compliance centre screen | `Backlog` | Matches wireframe |
| X-09 | **Solicitor review of X-02, X-03 logic** | `Blocked` | Human owns. Needs a real solicitor. |

---

## SLICE 4 — AI layer · `Backlog`

| ID | Story | State |
|---|---|---|
| AI-01 | Agent orchestrator with model routing (Haiku/Sonnet) | `Backlog` |
| AI-02 | Response caching layer | `Backlog` |
| AI-03 | Tier-1 cost telemetry (operator view) | `Backlog` |
| AI-04 | Listing copywriter agent | `Backlog` |
| AI-05 | Lead scorer agent | `Backlog` |
| AI-06 | Human-approval gate on every AI output | `Backlog` |
| AI-07 | **Guard: AI can never write a compliance value** | `Backlog` | Architectural test |

---

## SLICE 5 — Settlement (stages 10–13) · `Backlog` ⚠️

> **Same rule as Slice 3 — solicitor verification required.**

| ID | Story | State |
|---|---|---|
| S-01 | Settlement apportionment calculator — pure function | `Backlog` |
| S-02 | Settlement ledger screen | `Backlog` |
| S-03 | Pre-settlement inspection tracking | `Backlog` |
| S-04 | Post-sale follow-up (stages 12–13) | `Backlog` |
| S-05 | Referral tracking | `Backlog` |

---

## SLICE 6+ — Deferred · `Backlog`

| ID | Story | State |
|---|---|---|
| Z-01 | DTO mode | `Backlog` |
| Z-02 | Portal syndication (REA, Domain) | `Blocked` — needs API agreements |
| Z-03 | Market data integration (CoreLogic/PropTrack) | `Blocked` — needs API agreement |
| Z-04 | PEXA settlement integration | `Blocked` — needs API agreement |
| Z-05 | Tier-2 agency dashboard | `Backlog` |
| Z-06 | Tier-3 agent/owner views | `Backlog` |
| Z-07 | Mobile app | `Backlog` |
| Z-08 | Legal workspace + document vault | `Backlog` |

---

## Parallel track (human owns, not code)

| ID | Item | State |
|---|---|---|
| PT-01 | IP Australia trademark search — "Shilpi", classes 9/42/36 | `Ready` |
| PT-02 | Legal opinion — platform licensing, trust handling | `Ready` |
| PT-03 | API talks: REA, Domain, CoreLogic, PEXA | `Ready` |
| PT-04 | Entity structure; build-to-sell vs operate | `Backlog` |
| PT-05 | 1–2 beta agencies + 2 conveyancers committed | `Ready` |
| PT-06 | Logo decision | `Backlog` |
| PT-07 | Domain: shilpi.com.au + shilpi.au | `Ready` |

---

## Change log

| Date | Change | By |
|---|---|---|
| Session 1 | Backlog created | Architect chat |
