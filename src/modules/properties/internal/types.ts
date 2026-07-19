export type PropertyType = "house" | "unit" | "townhouse" | "land";

export const PROPERTY_TYPES: readonly PropertyType[] = [
  "house",
  "unit",
  "townhouse",
  "land",
];

/** The physical asset. Separate from a deal — one property, potentially many deals over time. */
export interface Property {
  id: string;
  agencyId: string;
  address: string;
  suburb: string | null;
  postcode: string | null;
  state: string;
  propertyType: PropertyType | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  landSizeSqm: number | null;
  zoning: string | null;
  createdAt: string;
}

/** Fields accepted when creating a property. Address required; the rest optional. */
export interface NewProperty {
  address: string;
  suburb?: string | null;
  postcode?: string | null;
  state?: string | null;
  propertyType?: PropertyType | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  parking?: number | null;
  landSizeSqm?: number | null;
  zoning?: string | null;
}

/** Partial update — only provided fields are written. */
export interface PropertyUpdate {
  address?: string;
  suburb?: string | null;
  postcode?: string | null;
  state?: string | null;
  propertyType?: PropertyType | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  parking?: number | null;
  landSizeSqm?: number | null;
  zoning?: string | null;
}
