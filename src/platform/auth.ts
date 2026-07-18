import type { User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "./supabase/server";

/**
 * The currently authenticated Supabase Auth user, or null if not logged in.
 * Uses `getUser()` (which re-validates against the auth server) rather than
 * `getSession()`, so a request can trust the identity.
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
