/**
 * `platform` — the only global. Public interface for SERVER code.
 *
 * Other modules import server-side helpers from `@/platform`:
 *   import { createServerSupabaseClient, getCurrentUser, getCurrentAgencyId } from "@/platform";
 *
 * Client Components must import the browser client directly from
 * `@/platform/supabase/browser` — it cannot be re-exported here, because this
 * barrel pulls in `next/headers` (server-only) via the server client.
 */

export type { SupabaseEnv } from "./env";
export { getSupabaseEnv, isSupabaseConfigured } from "./env";
export { createServerSupabaseClient } from "./supabase/server";
export { getCurrentUser } from "./auth";
export { getCurrentAgencyId } from "./tenancy";
