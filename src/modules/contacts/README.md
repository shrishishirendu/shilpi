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

## Public interface (built — C-01…C-05)

Import only from `@/modules/contacts` — never from `internal/*`:

```ts
import {
  createContact,   // NewContact -> Contact (sets agency_id; RLS WITH CHECK enforces it)
  listContacts,    // agency's contacts, name-sorted
  searchContacts,  // partial name match (ilike)
  getContact,      // by id, or null (RLS hides other agencies')
  updateContact,   // partial update
  validateContact, // pure: name required, email optional-but-valid
  type Contact, type NewContact, type ContactUpdate,
} from "@/modules/contacts";
```

Internals: `internal/{types,validate,repository}.ts`. The repository takes the Supabase client
as a parameter (so integration tests drive it with an authenticated client); `index.ts` wires it
to `platform`'s server client. Agency scoping is enforced by RLS, not by callers.
UI lives in `src/app/(app)/contacts/`.
