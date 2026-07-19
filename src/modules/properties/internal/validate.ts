import { PROPERTY_TYPES, type PropertyType } from "./types";

/**
 * Pure property validation. Address is required; property type (if given) must
 * be one of the allowed values; counts must be whole non-negative numbers and
 * land size a non-negative number. Returns a message or null.
 */
export function validateProperty(input: {
  address: string;
  propertyType?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  parking?: number | null;
  landSizeSqm?: number | null;
}): string | null {
  if (!input.address || !input.address.trim()) return "Address is required.";

  if (
    input.propertyType &&
    !PROPERTY_TYPES.includes(input.propertyType as PropertyType)
  ) {
    return "Choose a valid property type.";
  }

  const counts: [string, number | null | undefined][] = [
    ["Bedrooms", input.bedrooms],
    ["Bathrooms", input.bathrooms],
    ["Parking", input.parking],
  ];
  for (const [label, val] of counts) {
    if (val != null && (!Number.isInteger(val) || val < 0)) {
      return `${label} must be a whole number (0 or more).`;
    }
  }

  if (
    input.landSizeSqm != null &&
    (Number.isNaN(input.landSizeSqm) || input.landSizeSqm < 0)
  ) {
    return "Land size must be a positive number.";
  }

  return null;
}
