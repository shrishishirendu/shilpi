# `compliance` module — the safety layer

Deterministic gates, deadlines, and an immutable audit trail.

| | |
|---|---|
| **Owns tables** | `compliance_items` |
| **Depends on** | `deals` (via interface) |
| **Never touches** | **AI — ever** |

> ⚠️ **Locked decision D3 — the single most important rule in the project.**
> Cooling-off dates, stamp duty, finance deadlines, deposit and settlement figures have
> **legal consequences**. They are computed by **pure, fully-unit-tested functions**, never
> by AI. Comment the *legal basis*, not just the code. Every calculation writes to an
> immutable audit trail. NSW public holidays are **data**, not hardcoded.

**Not built in Phase 1 (Slice 1).** This module is Slice 3 and requires human + solicitor
sign-off on the *logic* — passing tests alone are not enough. When work reaches here, stop
and write the question into `PROJECT_STATE.md` first.

Public interface: `index.ts` (added with the X-0x stories). Import only from
`@/modules/compliance`, never `internal/*`.
