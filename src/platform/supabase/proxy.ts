import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv, isSupabaseConfigured } from "../env";

/**
 * Refreshes the Supabase auth session on every request and keeps the auth
 * cookies in sync between the request and the response. This is what makes the
 * session PERSIST: Server Components can only read cookies, so without a
 * proxy (Next.js middleware) to write refreshed tokens, a session would
 * silently die when its access token expires. Called from `src/proxy.ts`.
 */
export async function updateSession(
  request: NextRequest,
): Promise<NextResponse> {
  // If env isn't wired, don't crash every request — just pass through.
  if (!isSupabaseConfigured()) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Touch the user to trigger a token refresh when needed. Do not run code
  // between createServerClient and getUser() — it can desync sessions.
  await supabase.auth.getUser();

  return response;
}
