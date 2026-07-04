import { beforeEach, describe, expect, it, vi } from "vitest";

describe("contact config", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("uses the default RoundDate contact email when no env override exists", async () => {
    const { contactEmail, contactEmailHref, defaultContactEmail } = await import("./contact");

    expect(defaultContactEmail).toBe("hello@rounddate.pl");
    expect(contactEmail).toBe(defaultContactEmail);
    expect(contactEmailHref).toBe(`mailto:${defaultContactEmail}`);
  });

  it("allows overriding the public contact email from env", async () => {
    vi.stubEnv("NEXT_PUBLIC_CONTACT_EMAIL", "team@rounddate.pl");

    const { contactEmail, contactEmailHref } = await import("./contact");

    expect(contactEmail).toBe("team@rounddate.pl");
    expect(contactEmailHref).toBe("mailto:team@rounddate.pl");
  });
});
