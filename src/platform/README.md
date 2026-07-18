# `/platform` — the only global

Everything else is a module; `platform` is the shared foundation they all stand on.

Owns:

- **DB client** — the Supabase client, configured once.
- **Auth helper** — reads the current Supabase Auth session / `auth.uid()`.
- **Tenancy resolver** — resolves the logged-in user's `agency_id` (mirrors the
  `current_agency_id()` SQL helper; RLS is the real enforcement — D5).
- **Logging** — structured logging used across modules.

Rules:

- `platform` depends on **no module**. Dependencies flow *into* it, never out.
- Multi-tenancy is enforced in the database via Row Level Security, not just here. App-side
  tenancy resolution is a convenience, never the security boundary.

Built in **F-06**, right after the app scaffold and test framework are in place.
