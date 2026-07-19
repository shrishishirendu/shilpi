import { describe, it, expect } from "vitest";
import { validateProperty } from "../validate";

describe("validateProperty", () => {
  it("accepts an address alone", () => {
    expect(validateProperty({ address: "1 King St" })).toBeNull();
  });

  it("requires a non-blank address", () => {
    expect(validateProperty({ address: "" })).toMatch(/address/i);
    expect(validateProperty({ address: "   " })).toMatch(/address/i);
  });

  it("accepts a valid property type", () => {
    expect(
      validateProperty({ address: "1 King St", propertyType: "house" }),
    ).toBeNull();
  });

  it("rejects an invalid property type", () => {
    expect(
      validateProperty({ address: "1 King St", propertyType: "castle" }),
    ).toMatch(/valid property type/i);
  });

  it("rejects negative or non-integer counts", () => {
    expect(validateProperty({ address: "x", bedrooms: -1 })).toMatch(/bedrooms/i);
    expect(validateProperty({ address: "x", bathrooms: 1.5 })).toMatch(
      /bathrooms/i,
    );
  });

  it("rejects negative land size", () => {
    expect(validateProperty({ address: "x", landSizeSqm: -5 })).toMatch(
      /land size/i,
    );
  });

  it("accepts valid counts and land size", () => {
    expect(
      validateProperty({
        address: "x",
        bedrooms: 3,
        bathrooms: 2,
        parking: 1,
        landSizeSqm: 450.5,
      }),
    ).toBeNull();
  });
});
