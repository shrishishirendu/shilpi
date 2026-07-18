import { describe, it, expect } from "vitest";
import { validateSignUp, type SignUpInput } from "../validate";

const valid: SignUpInput = {
  fullName: "Ada Vendor",
  agencyName: "Harbour Realty",
  email: "ada@example.com",
  password: "secret123",
};

describe("validateSignUp", () => {
  it("accepts valid input", () => {
    expect(validateSignUp(valid)).toBeNull();
  });

  it("requires a name", () => {
    expect(validateSignUp({ ...valid, fullName: "" })).toMatch(/name/i);
  });

  it("requires an agency name", () => {
    expect(validateSignUp({ ...valid, agencyName: "" })).toMatch(/agency/i);
  });

  it("requires an email", () => {
    expect(validateSignUp({ ...valid, email: "" })).toMatch(/email/i);
  });

  it("rejects a malformed email", () => {
    expect(validateSignUp({ ...valid, email: "not-an-email" })).toMatch(
      /valid email/i,
    );
  });

  it("rejects a password shorter than 6 characters", () => {
    expect(validateSignUp({ ...valid, password: "12345" })).toMatch(
      /6 characters/i,
    );
  });
});
