# Shilpi — Development Requirements

**Status:** Living document. This is the reference both the human and Claude Code work from.
**Last updated:** Session 1 — pre-build.
**Supersedes:** `Shilpi_Build_Brief_for_Claude_Code.md` (that file remains valid; this one adds the modular structure and consolidates all locked decisions).

---

## 0. How to use this document

- **Claude Code:** read this first, then `Shilpi_Phase1_Data_Model.md`, then `shilpi_phase1_schema.sql`. Build against `Shilpi_Wireframe_v2.html` as the visual spec.
- **The human (product owner):** makes all binding decisions. Carries decisions to Claude Code and brings `PROJECT_STATE.md` back to the architect chat.
- **Architect chat:** design and decision support. Never talks to Claude Code directly.

If this document and any other artifact disagree, **this document wins** — and flag the conflict.

---

## 1. What Shilpi is

Shilpi (शिल्पी — Sanskrit for *artisan / craftsperson*) is an end-to-end property transaction platform for the Australian market, NSW/Sydney first.

**The differentiator:** existing tools (Rex, VaultRE, PropertyMe, Agentbox) stop at contract exchange. Shilpi crosses the transaction boundary — CRM → listings → compliance → exchange → settlement — in one connected flow, with an AI agent layer that assists but never decides.

**Two modes:**
- **Agent mode** — licensed agents and agencies. *Phase 1 builds this only.*
- **DTO mode (Direct-to-Owner)** — owners transacting without an agent, flat $4,900 fee vs 2.5–4% commission. *Deferred. The only hook is `deals.mode`.*

---

## 2. Locked decisions

These are settled. Do not revisit without the human explicitly reopening them.

| # | Decision | Rationale |
|---|---|---|
| D1 | **Agent mode only in Phase 1** | Focus. DTO hook is one column (`deals.mode`), nothing more. |
| D2 | **Unified contacts, role on the deal** | One person = one `contacts` row. Role (`buyer`/`vendor`/`solicitor`) lives on `deal_contacts`. Sydney vendors are usually also buyers — separate tables would fracture the person and break the referral engine. |
| D3 | **Compliance is deterministic code, NEVER AI** | Cooling-off dates, stamp duty, finance deadlines have legal consequences. Pure, testable, audited functions with an audit trail. This is the single most important rule in the project. |
| D4 | **AI assists, never autopilots** | Every AI output is shown to a human before it takes effect. |
| D5 | **Multi-tenant from line one** | Every table carries `agency_id`. Row Level Security enforced in the database, not just app code. |
| D6 | **Modular monolith — not standalone products** | One deployable app, one DB, one auth. Strict internal module boundaries. Extract a module later only when a customer proves demand. |
| D7 | **Supabase + Vercel, Sydney region** | Phase 1: near-zero cost. Phase 2: paid tiers. Phase 3: full AWS ap-southeast-2 when funded and at scale. |
| D8 | **Three-tier observability** | Operator sees full cost. Agency sees usage/value. Agent & DTO owner see outcomes only, no cost meter. |
| D9 | **Smallest sellable slice first** | Do not build ahead of the current slice. Note ideas in `PROJECT_STATE.md`; don't implement them. |
| D10 | **Name: Shilpi** | Working name. Trademark search pending (parallel track, non-blocking). |

---

## 3. Tech stack (locked)

| Layer | Choice | Notes |
|---|---|---|
| Database | Supabase (PostgreSQL) | Sydney region `ap-southeast-2` |
| Auth | Supabase Auth | `users.id` mirrors `auth.users.id` |
| Storage | Supabase Storage | Documents, later |
| Frontend | React / Next.js | Match the wireframe |
| Hosting | Vercel | Frontend |
| Email | Resend | Transactional |
| AI (later) | Anthropic Claude via orchestrator | Haiku routine, Sonnet complex. **Not in Phase 1.** |

Keep the stack boring. Do not add a service or library without the human approving it.

---

## 4. Modular architecture

### 4.1 The principle

**One deployable app. One database. One auth. Strict internal boundaries.**

This gives replaceable, testable, independently-workable modules — while preserving the connected flow that is Shilpi's whole reason to exist. A well-bounded module can be extracted later; six fragmented products cannot be un-fragmented.

### 4.2 Module map

```
/src
  /modules
    /contacts        — people; no role, no deal knowledge
    /properties      — the physical asset
    /deals           — the 13-stage spine; owns deal_contacts + stage_history
    /compliance      — deterministic gates, deadlines, audit (NEVER AI)
    /offers          — offer lifecycle
    /ai              — agent orchestrator + 8 agent services (Phase 2+)
  /contracts         — shared types & module interfaces
  /platform          — auth, tenancy, db client, logging
```

| Module | Owns these tables | Depends on | Never touches |
|---|---|---|---|
| `contacts` | `contacts` | platform | deals, offers |
| `properties` | `properties` | platform | deals, contacts |
| `deals` | `deals`, `deal_contacts`, `deal_stages`, `stage_history`, `activities`, `tasks` | contacts, properties (via interface) | compliance internals |
| `compliance` | `compliance_items` | deals (via interface) | AI — ever |
| `offers` | `offers` | deals, contacts (via interface) | compliance internals |
| `ai` | (own tables, later) | all (via interface) | writing compliance values |

### 4.3 The rules that make it real

These are what separate a modular monolith from folders with delusions:

1. **A module owns its tables.** No other module reads or writes them directly.
2. **Cross-module access goes through the module's public interface only.** Export a narrow API from each module (`/modules/deals/index.ts`); import only from that path. Never reach into `/modules/deals/internal/*`.
3. **No cross-module SQL joins.** If `offers` needs deal data, it calls the deals interface. Do not join `offers` to `deals` in a query that lives in the offers module.
4. **Shared types live in `/contracts`.** Both sides import the type; neither owns it.
5. **Dependencies flow one way.** `compliance` may depend on `deals`. `deals` must not depend on `compliance`. If you need a cycle, the boundary is wrong — stop and flag it.
6. **`platform` is the only global.** Auth, tenancy resolution, DB client, logging. Everything else is a module.
7. **Every module is independently testable.** A module's tests must run without booting another module.

### 4.4 The extraction test

Before adding anything to a module, ask: *if we lifted this module out tomorrow, would this line come with it, or would it break?* If it would break, the boundary is wrong.

---

## 5. Data model

Full detail in `Shilpi_Phase1_Data_Model.md`. SQL in `shilpi_phase1_schema.sql`.

**12 tables:** `agencies`, `users`, `contacts`, `properties`, `deals`, `deal_contacts`, `deal_stages`, `stage_history`, `compliance_items`, `offers`, `tasks`, `activities`.

**Deliberately deferred:** DTO tables, AI cost/log tables, legal workspace documents, settlement ledger lines, portal syndication mappings.

**Schema changes:** the SQL is the contract. If a change is genuinely needed, record it in `PROJECT_STATE.md` under "Schema changes from the spec" with the reason, and flag it to the human. No silent changes.

---

## 6. Build order

### Slice 1 — Lead to listing (stages 1–4) ← **current**

Modules touched: `platform`, `contacts`, `properties`, `deals`.

1. Auth + agency setup — sign-up creates `agencies` + `users` (role `principal`), tied to Supabase Auth.
2. Contacts — create / view / edit / search. No role field on the contact.
3. Properties — create / view / edit.
4. Deals — create a deal, link contacts via `deal_contacts` with a role, starts at `current_stage = 1`.
5. Pipeline board — deals grouped by `current_stage`, matching the wireframe CRM screen.
6. Stage movement — advancing writes `deals.current_stage` + a `stage_history` row.

**Not in slice 1:** offers logic, compliance gates, contract exchange, settlement, any AI, any portal integration.

**Definition of done:**
- A user signs up, logs in, and is fully isolated from other agencies (RLS verified with a second account).
- Contacts, properties, deals all CRUD correctly.
- One contact can hold different roles on different deals (verify D2 works end to end).
- Pipeline board renders and deals move through stages 1–4.
- Every stage move writes `stage_history`.
- Module boundaries hold — no cross-module table access.

### Later slices (do not build yet)

| Slice | Scope | Notes |
|---|---|---|
| 2 | Offers + stages 5–6 | `offers` module |
| 3 | Compliance gates + stages 7–9 | **Human + solicitor verification required** |
| 4 | AI orchestrator + first 2 agents | Listing copywriter, lead scorer |
| 5 | Settlement + stages 10–13 | **Human + solicitor verification required** |
| 6+ | DTO mode, portal syndication | Post-Phase-1 |

---

## 7. The compliance rule (expanded)

This deserves its own section because it is the one that can genuinely hurt the business.

**Never AI-generated:** cooling-off dates and expiry, stamp duty amounts, finance clause deadlines, deposit calculations, settlement apportionment, any date with legal weight, any dollar figure that appears on a legal document.

**How to build these instead:**
- Pure functions, no side effects, fully unit-tested.
- Comment the *reasoning and legal basis*, not just the code — the human and eventually a solicitor must be able to read and verify the logic.
- Every calculation writes to an immutable audit trail.
- NSW public holiday calendar is data, not hardcoded.

**When Claude Code reaches any of this:** stop, write the question into `PROJECT_STATE.md`, and tell the human. Confident-but-wrong code here is the worst failure mode in the project.

---

## 8. Observability (three tiers)

Same telemetry pipeline, three permission levels. Build the pipeline once; gate the views.

| Tier | Audience | Sees | Never sees |
|---|---|---|---|
| 1 | Platform operator | AI cost per agent/txn/agency/model, tokens, routing split, cache hit rate, third-party API spend, system health, unit economics | — |
| 2 | Agency admin | AI actions vs allowance, admin hours saved, feature breakdown, team activity, own billing | Per-action cost, tokens, model names, COGS |
| 3 | Agent / DTO owner | "AI did X for you" — outcomes only. DTO owner sees flat fee + progress. | Any cost meter or usage cap |

Rationale: cost visibility anchors users on the wrong number and suppresses use of the features that create value.

---

## 9. Staying in sync — `PROJECT_STATE.md`

Claude Code maintains this file in the repo root. **Update at the end of every session, even short ones.**

```markdown
# Shilpi — Project State
_Last updated: [date] by Claude Code_

## Current slice
[e.g. Slice 1 — lead to listing]

## Done
- [what actually works now]

## In progress
- [what's half-built]

## Decisions made this session
- [any fork you resolved without the human — so the architect can sanity-check]

## Blockers / open questions
- [anything needing a decision]

## Schema changes from the spec
- [any deviation from shilpi_phase1_schema.sql, with why]

## Module boundary notes
- [any place the boundaries strained, or a cycle you had to avoid]

## Next up
- [what the next session should tackle]
```

Rules:
- Be honest about what does **not** work. Overstating progress breaks planning.
- Log every non-trivial decision the human didn't explicitly give you.
- The human pastes this into the architect chat before any design session.

---

## 10. When to stop and ask

Stop and ask the human when:
- A requirement is ambiguous or conflicts with the schema or wireframe.
- You want to add a library, service, or table not in this document.
- You hit compliance, money, dates with legal weight, or contracts.
- The current slice is bigger than it looked — or could be cut smaller.
- A module boundary forces a cycle or a cross-module join.

Building the wrong thing confidently is worse than pausing.

---

## 11. Parallel track (not blocking development)

The human owns these. Listed so they don't fall off the radar.

- [ ] IP Australia trademark search — "Shilpi", classes 9/42 (software) and 36 (real estate services)
- [ ] Legal opinion — does the platform need a licence? Trust-fund handling?
- [ ] API commercial talks — REA, Domain, CoreLogic, PEXA (months of lead time)
- [ ] Entity structure + build-to-sell vs operate decision
- [ ] 1–2 committed beta agencies, 2 conveyancers
- [ ] Logo — undecided; wireframe uses a placeholder "S"
