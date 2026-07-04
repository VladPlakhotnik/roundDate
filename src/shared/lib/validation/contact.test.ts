import { describe, expect, it } from "vitest";

import {
  emailSchema,
  normalizePolishPhone,
  optionalPolishPhoneSchema,
  polishPhoneSchema,
} from "./contact";

describe("contact validation", () => {
  it("normalizes and validates email addresses", () => {
    expect(emailSchema.parse("  Alisa@Example.COM ")).toBe("alisa@example.com");
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
  });

  it("normalizes Polish phone numbers to E.164", () => {
    expect(normalizePolishPhone("+48 500 111 222")).toBe("+48500111222");
    expect(polishPhoneSchema.parse("500-111-222")).toBe("+48500111222");
    expect(polishPhoneSchema.parse("0048 58 123 45 67")).toBe("+48581234567");
  });

  it("rejects non-Polish or malformed phone numbers", () => {
    expect(polishPhoneSchema.safeParse("+49 500 111 222").success).toBe(false);
    expect(polishPhoneSchema.safeParse("12345").success).toBe(false);
    expect(polishPhoneSchema.safeParse("phone 500111222").success).toBe(false);
  });

  it("allows empty optional Polish phone values", () => {
    expect(optionalPolishPhoneSchema.parse("")).toBe("");
    expect(optionalPolishPhoneSchema.parse("  +48 500 111 222 ")).toBe("+48500111222");
  });
});
