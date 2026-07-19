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

## Public interface (built — O-01…O-06)

Import only from `@/modules/offers`:

```ts
import {
  submitOffer,        // O-01 — new offer against a deal (starts 'submitted')
  listOffersForDeal,  // O-04 — offers for a deal + hydrated buyer name
  counterOffer, rejectOffer, withdrawOffer,   // O-02 — status moves
  acceptOffer,        // O-05 — sets 'accepted' AND advances the deal stage
  validateOffer, OFFER_STATUSES, TERMINAL_STATUSES,
  type Offer, type OfferView, type OfferStatus, type NewOffer,
} from "@/modules/offers";
```

Notes:
- **`acceptOffer` is the module's one cross-module *call*** — it invokes the `deals` interface
  (`advanceDealStage`) to move the deal forward. Advances first, then marks the offer accepted, so
  a deal already at the final stage aborts cleanly. This is the O-06 boundary case.
- Buyer names are hydrated via the `contacts` interface (`getContactsByIds`), not a SQL join.
- Repository (`internal/repository.ts`) touches only the `offers` table; agency scoping is via RLS
  (offers are scoped through their parent deal). UI lives in the deal detail page
  (`src/app/(app)/deals/[id]`), not a separate route.
