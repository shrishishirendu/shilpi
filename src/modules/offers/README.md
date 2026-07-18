# `offers` module

The offer lifecycle on a deal.

| | |
|---|---|
| **Owns tables** | `offers` |
| **Depends on** | `deals`, `contacts` (via their interfaces) |
| **Never touches** | `compliance` internals |

Offer statuses: `submitted` → `countered` → `accepted` / `rejected` / `withdrawn`.
Accepting an offer advances the deal stage — done by **calling the `deals` interface**, not
by touching `deals` tables directly. No cross-module joins.

**Not built in Phase 1 (Slice 1).** This module is Slice 2.

Public interface: `index.ts` (added with the O-0x stories). Import only from
`@/modules/offers`, never `internal/*`.
