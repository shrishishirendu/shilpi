/**
 * `properties` — public interface. Import only from `@/modules/properties`;
 * nothing reaches into `./internal/*`. Wrappers obtain the request-scoped
 * Supabase client (and agency) from `platform`; agency scoping is via RLS.
 */
import { createServerSupabaseClient, getCurrentAgencyId } from "@/platform";
import {
  insertProperty,
  selectProperties,
  selectPropertyById,
  updatePropertyById,
} from "./internal/repository";
import type { NewProperty, Property, PropertyUpdate } from "./internal/types";

export type {
  Property,
  NewProperty,
  PropertyUpdate,
  PropertyType,
} from "./internal/types";
export { PROPERTY_TYPES } from "./internal/types";
export { validateProperty } from "./internal/validate";

export async function createProperty(input: NewProperty): Promise<Property> {
  const agencyId = await getCurrentAgencyId();
  if (!agencyId) throw new Error("Not authenticated.");
  const supabase = await createServerSupabaseClient();
  return insertProperty(supabase, agencyId, input);
}

export async function listProperties(): Promise<Property[]> {
  const supabase = await createServerSupabaseClient();
  return selectProperties(supabase);
}

export async function getProperty(id: string): Promise<Property | null> {
  const supabase = await createServerSupabaseClient();
  return selectPropertyById(supabase, id);
}

export async function updateProperty(
  id: string,
  input: PropertyUpdate,
): Promise<Property> {
  const supabase = await createServerSupabaseClient();
  return updatePropertyById(supabase, id, input);
}
