# `/src` — Shilpi source layout

A **modular monolith**: one deployable app, one database, one auth, strict internal
boundaries. Structure per `docs/Shilpi_Development_Requirements.md` §4.2.

```
/src
  /modules
    /contacts     — people; no role, no deal knowledge
    /properties   — the physical asset
    /deals        — the 13-stage spine; owns deal_contacts + stage_history
    /compliance   — deterministic gates, deadlines, audit (NEVER AI)
    /offers       — offer lifecycle
    /ai           — agent orchestrator + agent services (Phase 2+)
  /contracts      — shared types & module interfaces
  /platform       — auth, tenancy, db client, logging (the only global)
```

## The rules that make it real (§4.3)

1. **A module owns its tables.** No other module reads or writes them directly.
2. **Cross-module access goes through the public interface only** — import from
   `@/modules/<name>` (its `index.ts`), never from `@/modules/<name>/internal/*`.
3. **No cross-module SQL joins.** If `offers` needs deal data, it calls the `deals`
   interface — it does not join `offers` to `deals` in a query.
4. **Shared types live in `/contracts`.** Both sides import the type; neither owns it.
5. **Dependencies flow one way.** `compliance` may depend on `deals`; `deals` must not
   depend on `compliance`. A cycle means the boundary is wrong — stop and flag it.
6. **`platform` is the only global.** Auth, tenancy resolution, DB client, logging.
7. **Every module is independently testable** — its tests run without booting another.

> **Extraction test:** *if we lifted this module out tomorrow, would this line come with
> it, or would it break?* If it would break, the boundary is wrong.

## Status

These folders are scaffolding only — the boundary contracts, not the code. Each module's
public interface (`index.ts`) and internals arrive with their Slice 1 stories. See
`../PROJECT_STATE.md` for what is actually built.
