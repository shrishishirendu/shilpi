import { describe, it, expect } from "vitest";

// F-05: the trivial passing test that proves the test framework runs.
// Real tests replace this as features land — but the suite must always be green.
describe("smoke", () => {
  it("runs the test framework", () => {
    expect(1 + 1).toBe(2);
  });
});
