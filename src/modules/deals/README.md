# `deals` module

The **spine**. Every property transaction is a `deal` that moves through the 13 stages.
Leads, listings, offers, and tasks all hang off a deal.

| | |
|---|---|
| **Owns tables** | `deals`, `deal_contacts`, `deal_stages`, `stage_history`, `activities`, `tasks` |
| **Depends on** | `contacts`, `properties` (via their interfaces) |
| **Never touches** | `compliance` internals |

Key rules:

- A deal starts at `current_stage = 1`, `status = 'active'`, `mode = 'agent'`.
- Roles on a deal live in `deal_contacts` (this is what makes unified contacts — D2 — work).
- **`stage_history` is append-only.** Every stage move inserts a row (`from`, `to`,
  `changed_by`, `changed_at`). No update or delete path may exist.
- Advancing a deal is where the future compliance gate (Slice 3) will hook in — leave the
  seam, don't build it yet.

## Public interface (built — D-01…D-08)

Import only from `@/modules/deals`:

```ts
import {
  createDeal,          // -> Deal at stage 1 (D-01); DB trigger writes null->1 history (D-04)
  listStages,          // the 13 seeded stages
  listDealCards,       // board cards, hydrated with property address + primary contact (D-05)
  getDealDetail,       // deal + property + linked contacts + stage history
  linkContactToDeal,   // link a contact WITH a role (D-02)
  advanceDealStage,    // next stage (D-06); DB trigger records the transition
  validateDealContact, DEAL_ROLES, MAX_STAGE,
  type Deal, type DealCard, type DealDetail, type DealRole, type DealStage,
} from "@/modules/deals";
```

Notes:
- **`stage_history` is written by a DB trigger** (`record_stage_change`, migration 005), never by
  the app, and INSERT/UPDATE/DELETE are revoked from the API roles — so it's genuinely
  append-only (D-04/D-06/D-07). The app only inserts/updates `deals`.
- **Property + contact data is hydrated via the `properties`/`contacts` interfaces**
  (`getPropertiesByIds` / `getContactsByIds`), not SQL joins — the one-way dependency the module
  map allows. The repository (`internal/repository.ts`) only touches deals' own four tables.
- Advancing is where the Slice-3 compliance gate will hook in — the seam is left, not built.

UI: `src/app/(app)/deals/` (board, create, detail). Nav label "CRM pipeline" → `/deals`.
