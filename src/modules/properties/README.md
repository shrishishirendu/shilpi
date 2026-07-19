# `properties` module

The physical asset — bricks and mortar: address, land, zoning. Separate from the deal
because the same property can be sold more than once (two deals, one property).

| | |
|---|---|
| **Owns tables** | `properties` |
| **Depends on** | `platform` |
| **Never touches** | `deals`, `contacts` |

## Public interface (built — P-01…P-04)

Import only from `@/modules/properties` — never from `internal/*`:

```ts
import {
  createProperty,   // NewProperty -> Property (sets agency_id; state defaults to NSW)
  listProperties,   // agency's properties, newest first
  getProperty,      // by id, or null (RLS hides other agencies')
  updateProperty,   // partial update
  validateProperty, // pure: address required, type/counts/land-size checked
  PROPERTY_TYPES,   // ['house','unit','townhouse','land']
  type Property, type NewProperty, type PropertyUpdate, type PropertyType,
} from "@/modules/properties";
```

Same shape as `contacts`: `internal/{types,validate,repository}.ts`; the repository takes the
Supabase client as a param; `index.ts` wires it to `platform`. Agency scoping via RLS. UI in
`src/app/(app)/properties/`. (No Phase-1 search — property search/planning is a later slice.)
