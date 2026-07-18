import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "../env";

/**
 * Supabase client for server contexts (Server Components, Route Handlers,
 * Server Actions). Reads/writes the auth session via Next's cookie store, so
 * Row Level Security sees the logged-in user — this is what makes tenancy real.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // `setAll` was called from a Server Component, where cookies are
          // read-only. Safe to ignore when middleware refreshes the session.
        }
      },
    },
  });
}
