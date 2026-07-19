"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/platform";
import { validateLogin } from "./validate";

export interface LoginState {
  error: string | null;
}

/**
 * A-02 — log in. On success the server client writes the session cookies, so
 * the session persists across requests (the middleware keeps refreshing it).
 */
export async function signIn(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const validationError = validateLogin({ email, password });
  if (validationError) return { error: validationError };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  // Generic message on purpose — don't reveal whether the email exists.
  if (error) return { error: "Invalid email or password." };

  redirect("/dashboard");
}
