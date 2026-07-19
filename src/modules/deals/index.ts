/**
 * `deals` — public interface. Owns the 13-stage spine (deals, deal_contacts,
 * deal_stages, stage_history). Import only from `@/modules/deals`.
 *
 * Property and contact data is hydrated through the `properties` and `contacts`
 * interfaces (not SQL joins), which is the one-way dependency the module map
 * allows: deals -> contacts, properties.
 */
import {
  createServerSupabaseClient,
  getCurrentAgencyId,
  getCurrentUser,
} from "@/platform";
import { getContactsByIds } from "@/modules/contacts";
import { getPropertiesByIds, getProperty } from "@/modules/properties";
import {
  insertDeal,
  insertDealContact,
  selectDealsWithLinks,
  selectDealWithLinks,
  selectStageHistory,
  selectStages,
  updateDealStage,
} from "./internal/repository";
import type {
  Deal,
  DealCard,
  DealContactView,
  DealDetail,
  DealRole,
  DealStage,
  NewDeal,
} from "./internal/types";

export const MAX_STAGE = 13;

export { DEAL_ROLES } from "./internal/types";
export { validateDealContact } from "./internal/validate";
export type {
  Deal,
  DealCard,
  DealContactView,
  DealDetail,
  DealRole,
  DealStage,
  DealStatus,
  StageHistoryEntry,
} from "./internal/types";

/** D-01 — create a deal at stage 1 (active/agent). The DB trigger writes the
 *  initial stage_history row (null -> 1); D-04. */
export async function createDeal(input: NewDeal = {}): Promise<Deal> {
  const agencyId = await getCurrentAgencyId();
  const user = await getCurrentUser();
  if (!agencyId || !user) throw new Error("Not authenticated.");
  const supabase = await createServerSupabaseClient();
  return insertDeal(supabase, agencyId, user.id, input);
}

export async function listStages(): Promise<DealStage[]> {
  const supabase = await createServerSupabaseClient();
  return selectStages(supabase);
}

/** D-05 — board cards, hydrated with property address + primary contact name. */
export async function listDealCards(): Promise<DealCard[]> {
  const supabase = await createServerSupabaseClient();
  const rows = await selectDealsWithLinks(supabase);

  const propertyIds = [
    ...new Set(
      rows
        .map((r) => r.deal.propertyId)
        .filter((x): x is string => x !== null),
    ),
  ];
  const contactIds = [
    ...new Set(rows.flatMap((r) => r.links.map((l) => l.contactId))),
  ];

  const [properties, contacts] = await Promise.all([
    getPropertiesByIds(propertyIds),
    getContactsByIds(contactIds),
  ]);
  const propMap = new Map(properties.map((p) => [p.id, p]));
  const contactMap = new Map(contacts.map((c) => [c.id, c]));

  return rows.map(({ deal, links }) => {
    const primary = links.find((l) => l.isPrimary) ?? links[0];
    const contact = primary ? contactMap.get(primary.contactId) : undefined;
    const property = deal.propertyId ? propMap.get(deal.propertyId) : undefined;
    return {
      id: deal.id,
      currentStage: deal.currentStage,
      status: deal.status,
      propertyAddress: property?.address ?? null,
      primaryContactName: contact?.fullName ?? null,
      contactCount: links.length,
    };
  });
}

export async function getDealDetail(id: string): Promise<DealDetail | null> {
  const supabase = await createServerSupabaseClient();
  const row = await selectDealWithLinks(supabase, id);
  if (!row) return null;
  const { deal, links } = row;

  const [property, contacts, stageHistory, stages] = await Promise.all([
    deal.propertyId ? getProperty(deal.propertyId) : Promise.resolve(null),
    getContactsByIds(links.map((l) => l.contactId)),
    selectStageHistory(supabase, id),
    selectStages(supabase),
  ]);

  const contactMap = new Map(contacts.map((c) => [c.id, c]));
  const contactViews: DealContactView[] = links.map((link) => ({
    link,
    contact: contactMap.get(link.contactId) ?? null,
  }));
  const stage = stages.find((s) => s.stageNumber === deal.currentStage) ?? null;

  return { deal, stage, property, contacts: contactViews, stageHistory };
}

/** D-02 — link a contact to a deal with a role. */
export async function linkContactToDeal(
  dealId: string,
  contactId: string,
  role: DealRole,
  isPrimary: boolean,
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  await insertDealContact(supabase, dealId, contactId, role, isPrimary);
}

/** D-06 — advance a deal to the next stage (the DB trigger records history). */
export async function advanceDealStage(dealId: string): Promise<Deal> {
  const supabase = await createServerSupabaseClient();
  const row = await selectDealWithLinks(supabase, dealId);
  if (!row) throw new Error("Deal not found.");
  const next = row.deal.currentStage + 1;
  if (next > MAX_STAGE) throw new Error("Deal is already at the final stage.");
  return updateDealStage(supabase, dealId, next, new Date().toISOString());
}
