# Shilpi — Phase 1 Data Model

**Scope:** Agent mode only. DTO deferred (hooks left where cheap).
**Database:** PostgreSQL on Supabase, Sydney region (ap-southeast-2).
**Prepared for:** the first Claude Code build session.

---

## Design decisions locked

1. **Agent mode only** in Phase 1. No DTO tables yet, but `deals` and `contacts` are structured so DTO slots in later without a rebuild.
2. **Unified contacts.** One person = one `contacts` row. Their role (buyer, vendor, etc.) lives on the link between a contact and a deal — never on the contact itself.
3. **A "deal" is the spine.** Every property transaction is a `deal` that moves through the 13 stages. Leads, listings, offers, and tasks all hang off a deal.
4. **Compliance is data, not vibes.** Stage gates, cooling-off dates, and deadlines are explicit rows with explicit logic — never inferred.
5. **Multi-tenant from day one.** Every table carries an `agency_id`. An agency only ever sees its own data. This is enforced in the database with Row Level Security (RLS), so it can't be bypassed by a bug in application code.

---

## The tables at a glance

| Table | What it holds | One-line purpose |
|---|---|---|
| `agencies` | The real estate agencies (tenants) | Top-level account; everything belongs to one |
| `users` | Agents & staff logins | Who can log in; linked to Supabase Auth |
| `contacts` | People (buyers, vendors, etc.) | One row per human, reused across deals |
| `properties` | Physical properties | The bricks and mortar; address, land, zoning |
| `deals` | Transactions through 13 stages | The spine — the thing that moves down the pipeline |
| `deal_contacts` | Links people to deals with a role | How one person plays different roles in different deals |
| `deal_stages` | The 13-stage definitions | Reference list of the lifecycle stages |
| `stage_history` | Every stage transition, timestamped | Audit trail + "days in stage" reporting |
| `compliance_items` | Per-deal compliance obligations | Cooling-off, finance clause, agreement expiry, etc. |
| `offers` | Offers made on a deal | Amount, conditions, status |
| `tasks` | To-dos and follow-ups | Agent's actionable list, often deadline-driven |
| `activities` | Timeline of events on a deal | The "recent activity" feed; calls, emails, notes |

That's 12 tables. Lean on purpose. Everything in the wireframe maps onto these.

---

## Table detail

### `agencies`
The tenant. Everything else belongs to an agency.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `name` | text | "Ray White Mosman" etc. |
| `licence_number` | text | NSW agency licence (Property & Stock Agents Act) |
| `address` | text | |
| `phone` | text | |
| `subscription_tier` | text | `starter` / `professional` / `enterprise` |
| `created_at` | timestamptz | |

### `users`
Agents and staff. Linked one-to-one with Supabase Auth (`auth.users`).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | **Same id as the Supabase Auth user** |
| `agency_id` | uuid (FK → agencies) | Which agency they work for |
| `full_name` | text | |
| `email` | text | |
| `role` | text | `principal` / `agent` / `admin` |
| `agent_licence_number` | text | Individual NSW agent licence; nullable for admin staff |
| `created_at` | timestamptz | |

### `contacts`
One row per human. Reused across deals. **No buyer/seller flag here** — that's what `deal_contacts` is for.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `agency_id` | uuid (FK → agencies) | |
| `full_name` | text | |
| `email` | text | |
| `phone` | text | |
| `address` | text | Their own home address |
| `notes` | text | Free text |
| `identity_verified` | boolean | VOI/KYC done? (GreenID later) |
| `created_at` | timestamptz | |

### `properties`
The physical asset. Separate from the deal, because the same property could be sold more than once over time (two deals, one property).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `agency_id` | uuid (FK → agencies) | |
| `address` | text | Full street address |
| `suburb` | text | |
| `postcode` | text | |
| `state` | text | Default `NSW` |
| `property_type` | text | `house` / `unit` / `townhouse` / `land` |
| `bedrooms` | int | |
| `bathrooms` | int | |
| `parking` | int | |
| `land_size_sqm` | numeric | |
| `zoning` | text | `R2` / `R3` / `R4` etc. |
| `floor_area_ratio` | numeric | FAR, nullable |
| `created_at` | timestamptz | |

### `deals` — the spine
Every transaction. This is the row that moves through the pipeline.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `agency_id` | uuid (FK → agencies) | |
| `property_id` | uuid (FK → properties) | Nullable early (a lead may have no property yet) |
| `owner_user_id` | uuid (FK → users) | The agent who owns this deal |
| `current_stage` | int (FK → deal_stages.stage_number) | 1–13 |
| `status` | text | `active` / `settled` / `withdrawn` / `lost` |
| `listing_price` | numeric | Nullable until listed |
| `sale_price` | numeric | Nullable until sold |
| `sale_method` | text | `private_treaty` / `auction` / `eoi` |
| `mode` | text | Default `agent`. **The DTO hook** — later values: `dto` |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `deal_contacts` — the clever bit
Links a contact to a deal **with a role**. This is what lets Sarah be a vendor on one deal and a buyer on another.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `deal_id` | uuid (FK → deals) | |
| `contact_id` | uuid (FK → contacts) | |
| `role` | text | `buyer` / `vendor` / `buyer_solicitor` / `vendor_solicitor` |
| `is_primary` | boolean | Primary buyer vs co-buyer |
| `created_at` | timestamptz | |

A single deal can have many `deal_contacts` (a vendor, their solicitor, a buyer, their solicitor). A single contact can appear in many deals. This many-to-many join is the whole reason unified contacts works.

### `deal_stages` — reference data
The 13 stages, seeded once. Doesn't change per agency.

| Column | Type | Notes |
|---|---|---|
| `stage_number` | int (PK) | 1–13 |
| `name` | text | "Enquiry & qualification" etc. |
| `category` | text | `lead` / `listing` / `offer` / `exchange` / `settlement` / `post_sale` |
| `requires_compliance_gate` | boolean | Does advancing PAST this stage need a gate cleared? |

### `stage_history` — audit + reporting
One row every time a deal changes stage. Never updated, only inserted. This gives you "days in stage", velocity reporting, and a tamper-evident trail.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `deal_id` | uuid (FK → deals) | |
| `from_stage` | int | Nullable (first entry) |
| `to_stage` | int | |
| `changed_by` | uuid (FK → users) | |
| `changed_at` | timestamptz | |
| `note` | text | Optional reason |

### `compliance_items` — the safety layer
Per-deal compliance obligations with explicit due dates. This is the deterministic, audited layer we agreed is **never** AI-generated.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `deal_id` | uuid (FK → deals) | |
| `type` | text | `cooling_off` / `finance_clause` / `agency_agreement` / `deposit` / `voi` |
| `due_date` | date | The hard deadline |
| `status` | text | `pending` / `cleared` / `breached` / `waived` |
| `blocks_stage_advance` | boolean | If true, the deal can't move forward until cleared |
| `detail` | jsonb | Type-specific data (e.g. cooling-off: business-day count, penalty %) |
| `created_at` | timestamptz | |

### `offers`
Offers on a deal.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `deal_id` | uuid (FK → deals) | |
| `buyer_contact_id` | uuid (FK → contacts) | Who made the offer |
| `amount` | numeric | |
| `status` | text | `submitted` / `countered` / `accepted` / `rejected` / `withdrawn` |
| `is_conditional` | boolean | Subject to finance / B&P? |
| `conditions` | text | Free text of conditions |
| `settlement_days` | int | Proposed settlement period |
| `created_at` | timestamptz | |

### `tasks`
Agent to-dos, often deadline-driven.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `agency_id` | uuid (FK → agencies) | |
| `deal_id` | uuid (FK → deals) | Nullable (some tasks aren't deal-specific) |
| `assigned_to` | uuid (FK → users) | |
| `title` | text | |
| `due_date` | date | |
| `status` | text | `open` / `done` |
| `created_at` | timestamptz | |

### `activities`
The timeline feed. Calls, emails, notes, open homes, stage changes surfaced to the UI.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `agency_id` | uuid (FK → agencies) | |
| `deal_id` | uuid (FK → deals) | Nullable |
| `contact_id` | uuid (FK → contacts) | Nullable |
| `user_id` | uuid (FK → users) | Who did it |
| `type` | text | `call` / `email` / `note` / `open_home` / `inspection` / `stage_change` |
| `summary` | text | One-line description for the feed |
| `occurred_at` | timestamptz | |

---

## How the wireframe maps to these tables

| Wireframe screen | Reads from / writes to |
|---|---|
| Dashboard | `deals`, `activities`, `compliance_items` (alerts) |
| CRM pipeline | `deals` grouped by `current_stage`, with `deal_stages` for column headers |
| Property search / planning | `properties` |
| Contact / lead | `contacts` + `deal_contacts` |
| Offers | `offers` |
| Compliance centre | `compliance_items` |
| Contract exchange | `deals` + `compliance_items` (the gate) |
| Activity feed | `activities` |
| Tasks / follow-ups | `tasks` |

Everything visible in the Phase 1 wireframe is backed by one of these 12 tables. Nothing missing, nothing speculative.

---

## What we deliberately left OUT of Phase 1

- **DTO tables** (owner-direct listings, DTO offers, platform-fee records) — deferred. The `deals.mode` column is the only hook we left.
- **AI agent logs / cost tracking** — the Tier-1 observability tables. They come when we build the AI orchestrator, not now.
- **Legal workspace documents, settlement ledger lines** — these are later-phase. Phase 1 stops at offer/exchange tracking, not full settlement.
- **Portal syndication mappings** (REA/Domain external IDs) — added when we wire up those integrations.

Keeping these out is the discipline. They each get added as their own clean slice later.

---

## Next step after this

Once these tables exist in Supabase, the first user stories to write are the **lead-to-listing slice**: capture a contact, create a property, open a deal, move it through stages 1–4. That's the thinnest sellable thing and it exercises the whole spine.
