import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Deal,
  DealContactLink,
  DealRole,
  DealStage,
  DealStatus,
  NewDeal,
  SaleMethod,
  StageHistoryEntry,
} from "./types";

/**
 * Data access for the deals module's OWN tables: deals, deal_contacts,
 * deal_stages, stage_history. No reach into other modules' tables — property
 * and contact hydration happens in index.ts via their interfaces. Client-
 * injected; agency scoping via RLS. stage_history is written by a DB trigger
 * (migration 005), never here.
 */

const DEAL_COLUMNS =
  "id, agency_id, property_id, owner_user_id, current_stage, status, listing_price, sale_price, sale_method, mode, created_at, updated_at";
const LINK_COLUMNS =
  "id, deal_id, contact_id, role, is_primary, created_at";

interface DealRow {
  id: string;
  agency_id: string;
  property_id: string | null;
  owner_user_id: string | null;
  current_stage: number;
  status: DealStatus;
  listing_price: number | null;
  sale_price: number | null;
  sale_method: SaleMethod | null;
  mode: string;
  created_at: string;
  updated_at: string;
}

interface LinkRow {
  id: string;
  deal_id: string;
  contact_id: string;
  role: DealRole;
  is_primary: boolean;
}

interface DealWithLinksRow extends DealRow {
  deal_contacts: LinkRow[];
}

interface StageRow {
  stage_number: number;
  name: string;
  category: string;
  requires_compliance_gate: boolean;
}

interface HistoryRow {
  id: string;
  deal_id: string;
  from_stage: number | null;
  to_stage: number;
  changed_by: string | null;
  changed_at: string;
  note: string | null;
}

function toDeal(row: DealRow): Deal {
  return {
    id: row.id,
    agencyId: row.agency_id,
    propertyId: row.property_id,
    ownerUserId: row.owner_user_id,
    currentStage: row.current_stage,
    status: row.status,
    listingPrice: row.listing_price == null ? null : Number(row.listing_price),
    salePrice: row.sale_price == null ? null : Number(row.sale_price),
    saleMethod: row.sale_method,
    mode: row.mode,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toLink(row: LinkRow): DealContactLink {
  return {
    id: row.id,
    dealId: row.deal_id,
    contactId: row.contact_id,
    role: row.role,
    isPrimary: row.is_primary,
  };
}

function toStage(row: StageRow): DealStage {
  return {
    stageNumber: row.stage_number,
    name: row.name,
    category: row.category,
    requiresComplianceGate: row.requires_compliance_gate,
  };
}

function toHistory(row: HistoryRow): StageHistoryEntry {
  return {
    id: row.id,
    dealId: row.deal_id,
    fromStage: row.from_stage,
    toStage: row.to_stage,
    changedBy: row.changed_by,
    changedAt: row.changed_at,
    note: row.note,
  };
}

export interface DealWithLinks {
  deal: Deal;
  links: DealContactLink[];
}

export async function insertDeal(
  supabase: SupabaseClient,
  agencyId: string,
  ownerUserId: string,
  input: NewDeal,
): Promise<Deal> {
  // current_stage / status / mode come from the DB defaults (1 / active / agent).
  const { data, error } = await supabase
    .from("deals")
    .insert({
      agency_id: agencyId,
      owner_user_id: ownerUserId,
      property_id: input.propertyId ?? null,
    })
    .select(DEAL_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return toDeal(data as DealRow);
}

export async function selectDealsWithLinks(
  supabase: SupabaseClient,
): Promise<DealWithLinks[]> {
  const { data, error } = await supabase
    .from("deals")
    .select(`${DEAL_COLUMNS}, deal_contacts(${LINK_COLUMNS})`)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as DealWithLinksRow[]).map((row) => ({
    deal: toDeal(row),
    links: (row.deal_contacts ?? []).map(toLink),
  }));
}

export async function selectDealWithLinks(
  supabase: SupabaseClient,
  id: string,
): Promise<DealWithLinks | null> {
  const { data, error } = await supabase
    .from("deals")
    .select(`${DEAL_COLUMNS}, deal_contacts(${LINK_COLUMNS})`)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const row = data as DealWithLinksRow;
  return { deal: toDeal(row), links: (row.deal_contacts ?? []).map(toLink) };
}

export async function insertDealContact(
  supabase: SupabaseClient,
  dealId: string,
  contactId: string,
  role: DealRole,
  isPrimary: boolean,
): Promise<DealContactLink> {
  const { data, error } = await supabase
    .from("deal_contacts")
    .insert({
      deal_id: dealId,
      contact_id: contactId,
      role,
      is_primary: isPrimary,
    })
    .select(LINK_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return toLink(data as LinkRow);
}

export async function updateDealStage(
  supabase: SupabaseClient,
  dealId: string,
  newStage: number,
  updatedAt: string,
): Promise<Deal> {
  const { data, error } = await supabase
    .from("deals")
    .update({ current_stage: newStage, updated_at: updatedAt })
    .eq("id", dealId)
    .select(DEAL_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return toDeal(data as DealRow);
}

export async function selectStages(
  supabase: SupabaseClient,
): Promise<DealStage[]> {
  const { data, error } = await supabase
    .from("deal_stages")
    .select("stage_number, name, category, requires_compliance_gate")
    .order("stage_number", { ascending: true });
  if (error) throw new Error(error.message);
  return (data as StageRow[]).map(toStage);
}

export async function selectStageHistory(
  supabase: SupabaseClient,
  dealId: string,
): Promise<StageHistoryEntry[]> {
  const { data, error } = await supabase
    .from("stage_history")
    .select("id, deal_id, from_stage, to_stage, changed_by, changed_at, note")
    .eq("deal_id", dealId)
    .order("changed_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data as HistoryRow[]).map(toHistory);
}
