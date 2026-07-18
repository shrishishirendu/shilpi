"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/platform";
import { validateSignUp } from "./validate";

export interface SignUpState {
  error: string | null;
  awaitingConfirmation?: boolean;
}

/**
 * A-01 — sign-up creates an agency + a principal user.
 *
 * This action is deliberately thin: it validates input and calls Supabase Auth.
 * The atomic provisioning (one `agencies` row + one `users` row with
 * role='principal', id = auth user id) is done by the `handle_new_user` DB
 * trigger (migration 002), so the service_role key never touches the app.
 */
export async function signUpWithAgency(
  _prev: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const input = {
    fullName: String(formData.get("full_name") ?? "").trim(),
    agencyName: String(formData.get("agency_name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  };

  const validationError = validateSignUp(input);
  if (validationError) return { error: validationError };

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: { full_name: input.fullName, agency_name: input.agencyName },
    },
  });

  if (error) return { error: error.message };

  // Confirmations OFF -> a session is returned -> straight into the app.
  // Confirmations ON -> no session -> ask the user to confirm their email.
  if (!data.session) {
    return { error: null, awaitingConfirmation: true };
  }

  redirect("/dashboard");
}
