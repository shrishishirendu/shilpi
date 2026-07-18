# `ai` module — agent orchestrator (Phase 2+)

Model routing (Haiku routine / Sonnet complex), response caching, cost telemetry, and the
agent services (listing copywriter, lead scorer, …).

| | |
|---|---|
| **Owns tables** | own tables, later |
| **Depends on** | all modules (via their interfaces) |
| **Never touches** | **writing compliance values — ever** |

> **Locked decisions D3 & D4.** AI **assists, never autopilots** — every AI output is shown
> to a human before it takes effect. AI can **never** write a compliance value; enforce this
> with an architectural test (AI-07).

**Not in Phase 1.** Do not build ahead of the current slice (D9). This folder exists only to
hold the boundary.

Public interface: `index.ts` (added when the AI-0x stories are built).
