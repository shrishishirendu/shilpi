export interface LoginInput {
  email: string;
  password: string;
}

/**
 * Pure login validation — presence only. We deliberately don't check email
 * format or password strength here: Supabase Auth is the source of truth for
 * whether the credentials are valid, and we return a single generic message so
 * we never reveal which field was wrong.
 */
export function validateLogin(input: LoginInput): string | null {
  if (!input.email) return "Email is required.";
  if (!input.password) return "Password is required.";
  return null;
}
