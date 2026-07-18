import { createServerSupabaseClient } from "./supabase/server";

/**
 * Tenancy resolver — the agency_id of the logged-in user, or null if not
 * logged in / no matching users row.
 *
 * Mirrors the `current_agency_id()` SQL helper in shilpi_phase1_schema.sql.
 * NOTE: RLS in the database is the real tenancy boundary (decision D5); this
 * app-side lookup is a convenience for scoping queries and UI, never the
 * security guarantee.
 */
export async function getCurrentAgencyId(): Promise<string | null> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return null;

  const { data, error } = await supabase
    .from("users")
    .select("agency_id")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;
  return data.agency_id as string;
}
