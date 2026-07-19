"use server";

import { redirect } from "next/navigation";
import {
  createProperty,
  updateProperty,
  validateProperty,
  type PropertyType,
} from "@/modules/properties";

export interface PropertyFormState {
  error: string | null;
}

function readPropertyForm(formData: FormData) {
  const str = (k: string) => String(formData.get(k) ?? "").trim();
  const num = (k: string) => {
    const s = str(k);
    return s === "" ? null : Number(s);
  };
  return {
    address: str("address"),
    suburb: str("suburb") || null,
    postcode: str("postcode") || null,
    state: str("state") || null,
    propertyType: (str("property_type") || null) as PropertyType | null,
    bedrooms: num("bedrooms"),
    bathrooms: num("bathrooms"),
    parking: num("parking"),
    landSizeSqm: num("land_size_sqm"),
    zoning: str("zoning") || null,
  };
}

export async function createPropertyAction(
  _prev: PropertyFormState,
  formData: FormData,
): Promise<PropertyFormState> {
  const input = readPropertyForm(formData);
  const error = validateProperty(input);
  if (error) return { error };

  const property = await createProperty(input);
  redirect(`/properties/${property.id}`);
}

export async function updatePropertyAction(
  id: string,
  _prev: PropertyFormState,
  formData: FormData,
): Promise<PropertyFormState> {
  const input = readPropertyForm(formData);
  const error = validateProperty(input);
  if (error) return { error };

  await updateProperty(id, input);
  redirect(`/properties/${id}`);
}
