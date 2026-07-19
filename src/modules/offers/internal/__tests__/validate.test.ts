import { describe, it, expect } from "vitest";
import { validateOffer } from "../validate";

describe("validateOffer", () => {
  it("accepts a positive amount", () => {
    expect(validateOffer({ amount: 1_450_000 })).toBeNull();
  });

  it("requires an amount", () => {
    expect(validateOffer({ amount: null })).toMatch(/amount/i);
  });

  it("rejects zero or negative amounts", () => {
    expect(validateOffer({ amount: 0 })).toMatch(/greater than zero/i);
    expect(validateOffer({ amount: -5 })).toMatch(/greater than zero/i);
  });
});
