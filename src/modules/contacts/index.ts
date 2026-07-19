/**
 * `contacts` — public interface. The ONLY entry point other code may import
 * (`import { ... } from "@/modules/contacts"`). Nothing reaches into
 * `./internal/*` from outside the module.
 *
 * These wrappers obtain the request-scoped Supabase client (and agency) from
 * `platform`, then delegate to the internal repository. Agency scoping is
 * enforced by RLS.
 */
import { createServerSupabaseClient, getCurrentAgencyId } from "@/platform";
import {
  insertContact,
  selectContacts,
  searchContactsByName,
  selectContactById,
  selectContactsByIds,
  updateContactById,
} from "./internal/repository";
import type { Contact, ContactUpdate, NewContact } from "./internal/types";

export type { Contact, NewContact, ContactUpdate } from "./internal/types";
export { validateContact } from "./internal/validate";

export async function createContact(input: NewContact): Promise<Contact> {
  const agencyId = await getCurrentAgencyId();
  if (!agencyId) throw new Error("Not authenticated.");
  const supabase = await createServerSupabaseClient();
  return insertContact(supabase, agencyId, input);
}

export async function listContacts(): Promise<Contact[]> {
  const supabase = await createServerSupabaseClient();
  return selectContacts(supabase);
}

export async function searchContacts(query: string): Promise<Contact[]> {
  const supabase = await createServerSupabaseClient();
  return searchContactsByName(supabase, query);
}

export async function getContact(id: string): Promise<Contact | null> {
  const supabase = await createServerSupabaseClient();
  return selectContactById(supabase, id);
}

export async function getContactsByIds(ids: string[]): Promise<Contact[]> {
  const supabase = await createServerSupabaseClient();
  return selectContactsByIds(supabase, ids);
}

export async function updateContact(
  id: string,
  input: ContactUpdate,
): Promise<Contact> {
  const supabase = await createServerSupabaseClient();
  return updateContactById(supabase, id, input);
}
