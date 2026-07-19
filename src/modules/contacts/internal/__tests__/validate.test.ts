import { describe, it, expect } from "vitest";
import { validateContact } from "../validate";

describe("validateContact", () => {
  it("accepts a name with no other fields", () => {
    expect(validateContact({ fullName: "Ada Vendor" })).toBeNull();
  });

  it("requires a non-blank name", () => {
    expect(validateContact({ fullName: "" })).toMatch(/name/i);
    expect(validateContact({ fullName: "   " })).toMatch(/name/i);
  });

  it("accepts a valid email", () => {
    expect(
      validateContact({ fullName: "Ada", email: "ada@example.com" }),
    ).toBeNull();
  });

  it("rejects a malformed email", () => {
    expect(validateContact({ fullName: "Ada", email: "nope" })).toMatch(
      /valid email/i,
    );
  });

  it("treats a blank/absent email as fine (it's optional)", () => {
    expect(validateContact({ fullName: "Ada", email: "" })).toBeNull();
    expect(validateContact({ fullName: "Ada", email: null })).toBeNull();
  });
});
