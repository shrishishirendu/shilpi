import type { SupabaseClient } from "@supabase/supabase-js";
import type { NewProperty, Property, PropertyType, PropertyUpdate } from "./types";

/**
 * Data access for the `properties` table. Client-injected (see the contacts
 * repository for the rationale). Agency scoping is enforced by RLS; INSERT sets
 * agency_id because RLS WITH CHECK requires it to equal current_agency_id().
 */

const COLUMNS =
  "id, agency_id, address, suburb, postcode, state, property_type, bedrooms, bathrooms, parking, land_size_sqm, zoning, created_at";

interface PropertyRow {
  id: string;
  agency_id: string;
  address: string;
  suburb: string | null;
  postcode: string | null;
  state: string;
  property_type: PropertyType | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  land_size_sqm: number | null;
  zoning: string | null;
  created_at: string;
}

function toProperty(row: PropertyRow): Property {
  return {
    id: row.id,
    agencyId: row.agency_id,
    address: row.address,
    suburb: row.suburb,
    postcode: row.postcode,
    state: row.state,
    propertyType: row.property_type,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    parking: row.parking,
    // numeric can arrive as a string from PostgREST — normalise to a number.
    landSizeSqm: row.land_size_sqm == null ? null : Number(row.land_size_sqm),
    zoning: row.zoning,
    createdAt: row.created_at,
  };
}

export async function insertProperty(
  supabase: SupabaseClient,
  agencyId: string,
  input: NewProperty,
): Promise<Property> {
  const { data, error } = await supabase
    .from("properties")
    .insert({
      agency_id: agencyId,
      address: input.address.trim(),
      suburb: input.suburb ?? null,
      postcode: input.postcode ?? null,
      state: input.state?.trim() ? input.state.trim() : "NSW",
      property_type: input.propertyType ?? null,
      bedrooms: input.bedrooms ?? null,
      bathrooms: input.bathrooms ?? null,
      parking: input.parking ?? null,
      land_size_sqm: input.landSizeSqm ?? null,
      zoning: input.zoning ?? null,
    })
    .select(COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return toProperty(data as PropertyRow);
}

export async function selectProperties(
  supabase: SupabaseClient,
): Promise<Property[]> {
  const { data, error } = await supabase
    .from("properties")
    .select(COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as PropertyRow[]).map(toProperty);
}

export async function selectPropertyById(
  supabase: SupabaseClient,
  id: string,
): Promise<Property | null> {
  const { data, error } = await supabase
    .from("properties")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toProperty(data as PropertyRow) : null;
}

export async function updatePropertyById(
  supabase: SupabaseClient,
  id: string,
  input: PropertyUpdate,
): Promise<Property> {
  const patch: Record<string, unknown> = {};
  if (input.address !== undefined) patch.address = input.address.trim();
  if (input.suburb !== undefined) patch.suburb = input.suburb;
  if (input.postcode !== undefined) patch.postcode = input.postcode;
  if (input.state !== undefined) patch.state = input.state?.trim() || "NSW";
  if (input.propertyType !== undefined) patch.property_type = input.propertyType;
  if (input.bedrooms !== undefined) patch.bedrooms = input.bedrooms;
  if (input.bathrooms !== undefined) patch.bathrooms = input.bathrooms;
  if (input.parking !== undefined) patch.parking = input.parking;
  if (input.landSizeSqm !== undefined) patch.land_size_sqm = input.landSizeSqm;
  if (input.zoning !== undefined) patch.zoning = input.zoning;

  const { data, error } = await supabase
    .from("properties")
    .update(patch)
    .eq("id", id)
    .select(COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return toProperty(data as PropertyRow);
}
