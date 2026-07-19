import { describe, it, expect } from "vitest";
import { validateLogin } from "../validate";

describe("validateLogin", () => {
  it("accepts a non-empty email + password", () => {
    expect(validateLogin({ email: "a@b.com", password: "secret" })).toBeNull();
  });

  it("requires an email", () => {
    expect(validateLogin({ email: "", password: "secret" })).toMatch(/email/i);
  });

  it("requires a password", () => {
    expect(validateLogin({ email: "a@b.com", password: "" })).toMatch(
      /password/i,
    );
  });
});
