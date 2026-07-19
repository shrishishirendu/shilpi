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

## Public interface (built — F-06)

Server code imports from `@/platform`:

```ts
import {
  createServerSupabaseClient, // Supabase client bound to the request's auth cookies
  getCurrentUser,             // the logged-in auth.users user, or null
  getCurrentAgencyId,         // tenancy resolver — mirrors current_agency_id() in SQL
  isSupabaseConfigured,       // env presence check (never throws)
  getSupabaseEnv,             // { url, anonKey } or throws a helpful error
} from "@/platform";
```

**Client Components** import the browser client directly from
`@/platform/supabase/browser` (`createBrowserSupabaseClient`). It is *not* re-exported from
`@/platform`, because that barrel pulls in `next/headers` (server-only) via the server client
— importing it from the browser would break the build. This browser/server split is the one
sanctioned exception to "import only from index.ts".

The **Edge proxy** (`src/proxy.ts`, Next 16's renamed middleware convention) imports
`updateSession` from `@/platform/supabase/proxy` to refresh the auth session on every request —
the mechanism that makes login sessions persist. Kept separate from the Node server client (it
runs in the edge runtime and imports `next/server`, not `next/headers`).

Files: `env.ts`, `supabase/{server,browser,proxy}.ts`, `auth.ts`, `tenancy.ts`, `index.ts`.
Tests: `__tests__/{env,tenancy}.test.ts`. Logging is not built yet (added when a feature
first needs it).
