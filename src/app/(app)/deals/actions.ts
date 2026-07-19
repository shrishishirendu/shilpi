"use server";

import { redirect } from "next/navigation";
import {
  advanceDealStage,
  createDeal,
  linkContactToDeal,
  validateDealContact,
  type DealRole,
} from "@/modules/deals";

export async function createDealAction(formData: FormData): Promise<void> {
  const propertyId = String(formData.get("property_id") ?? "").trim() || null;
  const deal = await createDeal({ propertyId });
  redirect(`/deals/${deal.id}`);
}

export async function addContactAction(
  dealId: string,
  formData: FormData,
): Promise<void> {
  const contactId = String(formData.get("contact_id") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const isPrimary = formData.get("is_primary") === "on";

  // The form uses <select>s, so invalid values shouldn't occur; ignore if they do.
  if (!contactId || validateDealContact(role)) return;

  await linkContactToDeal(dealId, contactId, role as DealRole, isPrimary);
  redirect(`/deals/${dealId}`);
}

export async function advanceStageAction(dealId: string): Promise<void> {
  await advanceDealStage(dealId);
  redirect(`/deals/${dealId}`);
}
