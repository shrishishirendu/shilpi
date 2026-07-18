/**
 * Supabase environment access. Isomorphic (safe on server and client) — reads
 * only NEXT_PUBLIC_* vars, which Next inlines into both bundles.
 */

export interface SupabaseEnv {
  url: string;
  anonKey: string;
}

/**
 * Returns the Supabase URL + anon key, or throws a clear error if either is
 * missing. Called at request time (never at module load), so a build with empty
 * placeholders does not fail — it only errors when a real Supabase call runs
 * before the project is wired (F-01/F-02).
 */
export function getSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase environment not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (see .env.example).",
    );
  }

  return { url, anonKey };
}

/** True when both Supabase env vars are present. Never throws. */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
