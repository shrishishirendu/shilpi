import type { SupabaseClient } from "@supabase/supabase-js";
import type { Contact, ContactUpdate, NewContact } from "./types";

/**
 * Data access for the `contacts` table. These functions take the Supabase
 * client as a parameter (dependency injection) so they can be exercised
 * directly in integration tests with an authenticated client, and wrapped by
 * the module's public interface with the server client in the app.
 *
 * Agency scoping is enforced by RLS (contacts_isolation) — callers never filter
 * by agency_id themselves. INSERT still sets agency_id because RLS's WITH CHECK
 * requires it to equal current_agency_id().
 */

const COLUMNS =
  "id, agency_id, full_name, email, phone, address, notes, identity_verified, created_at";

interface ContactRow {
  id: string;
  agency_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  identity_verified: boolean;
  created_at: string;
}

function toContact(row: ContactRow): Contact {
  return {
    id: row.id,
    agencyId: row.agency_id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    notes: row.notes,
    identityVerified: row.identity_verified,
    createdAt: row.created_at,
  };
}

export async function insertContact(
  supabase: SupabaseClient,
  agencyId: string,
  input: NewContact,
): Promise<Contact> {
  const { data, error } = await supabase
    .from("contacts")
    .insert({
      agency_id: agencyId,
      full_name: input.fullName.trim(),
      email: input.email ?? null,
      phone: input.phone ?? null,
      address: input.address ?? null,
      notes: input.notes ?? null,
    })
    .select(COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return toContact(data as ContactRow);
}

export async function selectContacts(
  supabase: SupabaseClient,
): Promise<Contact[]> {
  const { data, error } = await supabase
    .from("contacts")
    .select(COLUMNS)
    .order("full_name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data as ContactRow[]).map(toContact);
}

export async function searchContactsByName(
  supabase: SupabaseClient,
  query: string,
): Promise<Contact[]> {
  const q = query.trim();
  if (!q) return selectContacts(supabase);
  // Escape LIKE wildcards so the query is treated literally.
  const pattern = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
  const { data, error } = await supabase
    .from("contacts")
    .select(COLUMNS)
    .ilike("full_name", pattern)
    .order("full_name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data as ContactRow[]).map(toContact);
}

export async function selectContactById(
  supabase: SupabaseClient,
  id: string,
): Promise<Contact | null> {
  const { data, error } = await supabase
    .from("contacts")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toContact(data as ContactRow) : null;
}

export async function updateContactById(
  supabase: SupabaseClient,
  id: string,
  input: ContactUpdate,
): Promise<Contact> {
  const patch: Record<string, unknown> = {};
  if (input.fullName !== undefined) patch.full_name = input.fullName.trim();
  if (input.email !== undefined) patch.email = input.email;
  if (input.phone !== undefined) patch.phone = input.phone;
  if (input.address !== undefined) patch.address = input.address;
  if (input.notes !== undefined) patch.notes = input.notes;

  const { data, error } = await supabase
    .from("contacts")
    .update(patch)
    .eq("id", id)
    .select(COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return toContact(data as ContactRow);
}
