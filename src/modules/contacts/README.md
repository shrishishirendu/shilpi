# `contacts` module

People. **One row per human**, reused across deals.

| | |
|---|---|
| **Owns tables** | `contacts` |
| **Depends on** | `platform` |
| **Never touches** | `deals`, `offers` |

**No role field on a contact.** A person's role (`buyer` / `vendor` / `buyer_solicitor` /
`vendor_solicitor`) lives on `deal_contacts`, owned by the `deals` module. This is locked
decision **D2** — Sydney vendors are usually also buyers, so a role on the person would
fracture the person and break the referral engine.

Public interface: `index.ts` (added with the C-0x stories). Other modules import only from
`@/modules/contacts` — never from `internal/*`.
