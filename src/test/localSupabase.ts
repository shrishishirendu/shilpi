import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase clients for integration tests, pointed at the LOCAL stack
 * (`supabase start`). Values come from .env.test (loaded in vitest.setup.ts),
 * falling back to the deterministic local defaults.
 */

const url = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const anonKey = process.env.SUPABASE_ANON_KEY ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const noPersist = {
  auth: { autoRefreshToken: false, persistSession: false },
} as const;

/** Privileged client — bypasses RLS. Use for test setup, assertions, cleanup. */
export function serviceClient(): SupabaseClient {
  return createClient(url, serviceKey, noPersist);
}

/**
 * Anonymous client — subject to RLS, like a real browser. Returns a FRESH
 * client each call, so signing in on one does not leak a session to another
 * (important for the RLS isolation test).
 */
export function anonClient(): SupabaseClient {
  return createClient(url, anonKey, noPersist);
}

export const LOCAL_SUPABASE_URL = url;
