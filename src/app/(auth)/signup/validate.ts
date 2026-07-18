export interface SignUpInput {
  fullName: string;
  agencyName: string;
  email: string;
  password: string;
}

export const MIN_PASSWORD_LENGTH = 6; // mirrors auth.minimum_password_length

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Pure signup validation. Returns a human-readable error message, or null when
 * the input is valid. Kept side-effect-free so it is unit-testable and reusable
 * on both client and server.
 */
export function validateSignUp(input: SignUpInput): string | null {
  if (!input.fullName) return "Your name is required.";
  if (!input.agencyName) return "Agency name is required.";
  if (!input.email) return "Email is required.";
  if (!EMAIL_RE.test(input.email)) return "Enter a valid email address.";
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}
