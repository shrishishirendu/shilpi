export type OfferStatus =
  | "submitted"
  | "countered"
  | "accepted"
  | "rejected"
  | "withdrawn";

export const OFFER_STATUSES: readonly OfferStatus[] = [
  "submitted",
  "countered",
  "accepted",
  "rejected",
  "withdrawn",
];

/** Terminal statuses can't be acted on further. */
export const TERMINAL_STATUSES: readonly OfferStatus[] = [
  "accepted",
  "rejected",
  "withdrawn",
];

export interface Offer {
  id: string;
  dealId: string;
  buyerContactId: string | null;
  amount: number;
  status: OfferStatus;
  isConditional: boolean;
  conditions: string | null;
  settlementDays: number | null;
  createdAt: string;
}

export interface NewOffer {
  buyerContactId?: string | null;
  amount: number;
  isConditional?: boolean;
  conditions?: string | null;
  settlementDays?: number | null;
}

/** An offer + the resolved buyer name (hydrated via the contacts interface). */
export interface OfferView {
  offer: Offer;
  buyerName: string | null;
}
