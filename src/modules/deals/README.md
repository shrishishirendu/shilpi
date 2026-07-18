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

Public interface: `index.ts` (added with the D-0x stories) — exports what `offers` and
`compliance` will later need. Import only from `@/modules/deals`, never `internal/*`.
