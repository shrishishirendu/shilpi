"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/platform";

/** A-02 — log out. Clears the Supabase session and returns to the login page. */
export async function signOut(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}
