import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "../env";

/**
 * Supabase client for Client Components (runs in the browser).
 * Import this directly from `@/platform/supabase/browser` in a "use client"
 * component. Server code uses `@/platform` (the server interface) instead.
 */
export function createBrowserSupabaseClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient(url, anonKey);
}
