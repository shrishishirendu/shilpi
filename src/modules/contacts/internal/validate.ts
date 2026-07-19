const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Pure contact validation. Name is required; email, if given, must look valid.
 * Returns a human-readable message or null. Side-effect-free and testable.
 */
export function validateContact(input: {
  fullName: string;
  email?: string | null;
}): string | null {
  if (!input.fullName || !input.fullName.trim()) return "Name is required.";
  const email = input.email?.trim();
  if (email && !EMAIL_RE.test(email)) {
    return "Enter a valid email address, or leave it blank.";
  }
  return null;
}
