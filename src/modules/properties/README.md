# `properties` module

The physical asset — bricks and mortar: address, land, zoning. Separate from the deal
because the same property can be sold more than once (two deals, one property).

| | |
|---|---|
| **Owns tables** | `properties` |
| **Depends on** | `platform` |
| **Never touches** | `deals`, `contacts` |

Public interface: `index.ts` (added with the P-0x stories). Other modules import only from
`@/modules/properties` — never from `internal/*`.
