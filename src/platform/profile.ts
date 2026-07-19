import { createServerSupabaseClient } from "./supabase/server";

export interface CurrentProfile {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  agencyId: string;
  agencyName: string;
}

/**
 * The logged-in user's profile joined to their agency, or null if not logged
 * in. Reads the `users` row (+ embedded `agencies.name`) — both RLS-scoped to
 * the caller's own agency. Used by the app shell to show who's signed in.
 */
export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return null;

  const { data, error } = await supabase
    .from("users")
    .select("full_name, role, agency_id, agencies(name)")
    .eq("id", user.id)
    .single();
  if (error || !data) return null;

  // `agencies` embeds as an object for a to-one FK, but handle an array too.
  const agencies = data.agencies as
    | { name: string }
    | { name: string }[]
    | null;
  const agencyName = Array.isArray(agencies)
    ? (agencies[0]?.name ?? "")
    : (agencies?.name ?? "");

  return {
    userId: user.id,
    email: user.email ?? "",
    fullName: (data.full_name as string) ?? "",
    role: (data.role as string) ?? "",
    agencyId: (data.agency_id as string) ?? "",
    agencyName,
  };
}
