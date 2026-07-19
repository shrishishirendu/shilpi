import { DEAL_ROLES, type DealRole } from "./types";

export function isValidRole(role: string): role is DealRole {
  return (DEAL_ROLES as readonly string[]).includes(role);
}

/** Validate a contact-link role. Returns a message or null. */
export function validateDealContact(role: string): string | null {
  if (!isValidRole(role)) return "Choose a valid role.";
  return null;
}
