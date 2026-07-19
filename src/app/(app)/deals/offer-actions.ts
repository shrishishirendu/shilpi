"use server";

import { redirect } from "next/navigation";
import {
  acceptOffer,
  counterOffer,
  rejectOffer,
  submitOffer,
  validateOffer,
  withdrawOffer,
} from "@/modules/offers";

export async function submitOfferAction(
  dealId: string,
  formData: FormData,
): Promise<void> {
  const str = (k: string) => String(formData.get(k) ?? "").trim();
  const num = (k: string) => {
    const s = str(k);
    return s === "" ? null : Number(s);
  };

  const amount = num("amount");
  if (validateOffer({ amount })) return;

  await submitOffer(dealId, {
    buyerContactId: str("buyer_contact_id") || null,
    amount: amount as number,
    isConditional: formData.get("is_conditional") === "on",
    conditions: str("conditions") || null,
    settlementDays: num("settlement_days"),
  });
  redirect(`/deals/${dealId}`);
}

export async function acceptOfferAction(
  dealId: string,
  offerId: string,
): Promise<void> {
  await acceptOffer(offerId);
  redirect(`/deals/${dealId}`);
}

export async function counterOfferAction(
  dealId: string,
  offerId: string,
): Promise<void> {
  await counterOffer(offerId);
  redirect(`/deals/${dealId}`);
}

export async function rejectOfferAction(
  dealId: string,
  offerId: string,
): Promise<void> {
  await rejectOffer(offerId);
  redirect(`/deals/${dealId}`);
}

export async function withdrawOfferAction(
  dealId: string,
  offerId: string,
): Promise<void> {
  await withdrawOffer(offerId);
  redirect(`/deals/${dealId}`);
}
