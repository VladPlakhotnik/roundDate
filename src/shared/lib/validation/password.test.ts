import { describe, expect, it } from "vitest";

import { getPasswordRequirements, isPasswordValid, passwordSchema } from "./password";

describe("password validation", () => {
  it("accepts a simple password with letters and a number", () => {
    expect(passwordSchema.safeParse("RoundDate2026").success).toBe(true);
    expect(isPasswordValid("RoundDate2026")).toBe(true);
  });

  it.each([
    ["short1", "length"],
    ["12345678", "letter"],
    ["RoundDate", "number"],
    ["Round Date 2026", "noSpaces"],
  ] as const)("rejects %s when the %s requirement is missing", (password, requirement) => {
    expect(passwordSchema.safeParse(password).success).toBe(false);
    expect(getPasswordRequirements(password)[requirement]).toBe(false);
  });

  it("rejects passwords longer than the auth backend limit", () => {
    expect(passwordSchema.safeParse(`RoundDate1${"a".repeat(128)}`).success).toBe(false);
  });
});
