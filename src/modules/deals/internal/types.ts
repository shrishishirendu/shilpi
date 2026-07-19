import type { Contact } from "@/modules/contacts";
import type { Property } from "@/modules/properties";

export type DealRole =
  | "buyer"
  | "vendor"
  | "buyer_solicitor"
  | "vendor_solicitor";

export const DEAL_ROLES: readonly DealRole[] = [
  "buyer",
  "vendor",
  "buyer_solicitor",
  "vendor_solicitor",
];

export type DealStatus = "active" | "settled" | "withdrawn" | "lost";
export type SaleMethod = "private_treaty" | "auction" | "eoi";

/** The spine. Every transaction is a deal moving through the 13 stages. */
export interface Deal {
  id: string;
  agencyId: string;
  propertyId: string | null;
  ownerUserId: string | null;
  currentStage: number;
  status: DealStatus;
  listingPrice: number | null;
  salePrice: number | null;
  saleMethod: SaleMethod | null;
  mode: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewDeal {
  propertyId?: string | null;
}

/** A reference stage (1–13), seeded once. */
export interface DealStage {
  stageNumber: number;
  name: string;
  category: string;
  requiresComplianceGate: boolean;
}

/** A contact linked to a deal WITH a role (decision D2 lives here). */
export interface DealContactLink {
  id: string;
  dealId: string;
  contactId: string;
  role: DealRole;
  isPrimary: boolean;
}

/** One stage transition — append-only (written by the DB trigger). */
export interface StageHistoryEntry {
  id: string;
  dealId: string;
  fromStage: number | null;
  toStage: number;
  changedBy: string | null;
  changedAt: string;
  note: string | null;
}

/** Board card — deal + resolved property address + primary contact name. */
export interface DealCard {
  id: string;
  currentStage: number;
  status: DealStatus;
  propertyAddress: string | null;
  primaryContactName: string | null;
  contactCount: number;
}

/** A linked contact plus the resolved contact record (via the contacts interface). */
export interface DealContactView {
  link: DealContactLink;
  contact: Contact | null;
}

/** Full deal detail — hydrated across the properties + contacts interfaces. */
export interface DealDetail {
  deal: Deal;
  stage: DealStage | null;
  property: Property | null;
  contacts: DealContactView[];
  stageHistory: StageHistoryEntry[];
}
