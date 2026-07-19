import type { SupabaseClient } from "@supabase/supabase-js";
import type { NewOffer, Offer, OfferStatus } from "./types";

/**
 * Data access for the `offers` table (offers' own table only). Client-injected;
 * agency scoping is via RLS (offers are scoped through their parent deal).
 */

const COLUMNS =
  "id, deal_id, buyer_contact_id, amount, status, is_conditional, conditions, settlement_days, created_at";

interface OfferRow {
  id: string;
  deal_id: string;
  buyer_contact_id: string | null;
  amount: number | string;
  status: OfferStatus;
  is_conditional: boolean;
  conditions: string | null;
  settlement_days: number | null;
  created_at: string;
}

function toOffer(row: OfferRow): Offer {
  return {
    id: row.id,
    dealId: row.deal_id,
    buyerContactId: row.buyer_contact_id,
    amount: Number(row.amount),
    status: row.status,
    isConditional: row.is_conditional,
    conditions: row.conditions,
    settlementDays: row.settlement_days,
    createdAt: row.created_at,
  };
}

export async function insertOffer(
  supabase: SupabaseClient,
  dealId: string,
  input: NewOffer,
): Promise<Offer> {
  const { data, error } = await supabase
    .from("offers")
    .insert({
      deal_id: dealId,
      buyer_contact_id: input.buyerContactId ?? null,
      amount: input.amount,
      is_conditional: input.isConditional ?? false,
      conditions: input.conditions ?? null,
      settlement_days: input.settlementDays ?? null,
    })
    .select(COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return toOffer(data as OfferRow);
}

export async function selectOffersByDeal(
  supabase: SupabaseClient,
  dealId: string,
): Promise<Offer[]> {
  const { data, error } = await supabase
    .from("offers")
    .select(COLUMNS)
    .eq("deal_id", dealId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as OfferRow[]).map(toOffer);
}

export async function selectOfferById(
  supabase: SupabaseClient,
  id: string,
): Promise<Offer | null> {
  const { data, error } = await supabase
    .from("offers")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toOffer(data as OfferRow) : null;
}

export async function updateOfferStatus(
  supabase: SupabaseClient,
  id: string,
  status: OfferStatus,
): Promise<Offer> {
  const { data, error } = await supabase
    .from("offers")
    .update({ status })
    .eq("id", id)
    .select(COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return toOffer(data as OfferRow);
}
