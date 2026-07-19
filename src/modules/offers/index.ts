/**
 * `offers` — public interface. Owns the `offers` table. Import only from
 * `@/modules/offers`.
 *
 * Depends (one-way) on `contacts` (to resolve buyer names) and `deals`
 * (accepting an offer advances the deal stage) — both via their interfaces.
 */
import { createServerSupabaseClient } from "@/platform";
import { getContactsByIds } from "@/modules/contacts";
import { advanceDealStage } from "@/modules/deals";
import {
  insertOffer,
  selectOfferById,
  selectOffersByDeal,
  updateOfferStatus,
} from "./internal/repository";
import { TERMINAL_STATUSES } from "./internal/types";
import type { NewOffer, Offer, OfferStatus, OfferView } from "./internal/types";

export { OFFER_STATUSES, TERMINAL_STATUSES } from "./internal/types";
export { validateOffer } from "./internal/validate";
export type { Offer, OfferStatus, OfferView, NewOffer } from "./internal/types";

/** O-01 — submit an offer against a deal (starts 'submitted'). */
export async function submitOffer(
  dealId: string,
  input: NewOffer,
): Promise<Offer> {
  const supabase = await createServerSupabaseClient();
  return insertOffer(supabase, dealId, input);
}

/** O-04 — offers for a deal, newest first, with the buyer name hydrated. */
export async function listOffersForDeal(dealId: string): Promise<OfferView[]> {
  const supabase = await createServerSupabaseClient();
  const offers = await selectOffersByDeal(supabase, dealId);

  const buyerIds = [
    ...new Set(
      offers
        .map((o) => o.buyerContactId)
        .filter((x): x is string => x !== null),
    ),
  ];
  const contacts = await getContactsByIds(buyerIds);
  const nameById = new Map(contacts.map((c) => [c.id, c.fullName]));

  return offers.map((offer) => ({
    offer,
    buyerName: offer.buyerContactId
      ? (nameById.get(offer.buyerContactId) ?? null)
      : null,
  }));
}

/** O-02 — counter / reject / withdraw just move the status. */
async function setStatus(id: string, status: OfferStatus): Promise<Offer> {
  const supabase = await createServerSupabaseClient();
  return updateOfferStatus(supabase, id, status);
}

export const counterOffer = (id: string) => setStatus(id, "countered");
export const rejectOffer = (id: string) => setStatus(id, "rejected");
export const withdrawOffer = (id: string) => setStatus(id, "withdrawn");

/**
 * O-05 — accepting an offer advances the deal stage. Advancing first means a
 * deal already at the final stage aborts cleanly (no half-applied accept). This
 * is the module's one cross-module *call* — into the `deals` interface (O-06).
 */
export async function acceptOffer(id: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const offer = await selectOfferById(supabase, id);
  if (!offer) throw new Error("Offer not found.");
  if ((TERMINAL_STATUSES as readonly string[]).includes(offer.status)) return;

  await advanceDealStage(offer.dealId);
  await updateOfferStatus(supabase, id, "accepted");
}
