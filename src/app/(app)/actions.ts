"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/platform";

/** Log out — clears the Supabase session and returns to the login page. */
export async function signOut(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}
