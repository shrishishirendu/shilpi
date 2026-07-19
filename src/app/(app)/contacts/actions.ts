"use server";

import { redirect } from "next/navigation";
import {
  createContact,
  updateContact,
  validateContact,
} from "@/modules/contacts";

export interface ContactFormState {
  error: string | null;
}

function readContactForm(formData: FormData) {
  const str = (k: string) => String(formData.get(k) ?? "").trim();
  return {
    fullName: str("full_name"),
    email: str("email") || null,
    phone: str("phone") || null,
    address: str("address") || null,
    notes: str("notes") || null,
  };
}

export async function createContactAction(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const input = readContactForm(formData);
  const error = validateContact(input);
  if (error) return { error };

  const contact = await createContact(input);
  redirect(`/contacts/${contact.id}`);
}

export async function updateContactAction(
  id: string,
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const input = readContactForm(formData);
  const error = validateContact(input);
  if (error) return { error };

  await updateContact(id, input);
  redirect(`/contacts/${id}`);
}
