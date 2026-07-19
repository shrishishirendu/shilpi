import { type NextRequest } from "next/server";
import { updateSession } from "@/platform/supabase/proxy";

// Next.js "proxy" convention (formerly "middleware"). Runs before requests to
// refresh the Supabase auth session so logins persist.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on all request paths except static assets and image files — those
     * don't carry an auth session and don't need a refresh.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
