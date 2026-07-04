import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
  headers: vi.fn(),
}));

import { getRequestLocaleFromRequest } from "./server";

describe("i18n server helpers", () => {
  it("uses a marketing language query parameter before the locale cookie", () => {
    const request = new Request("https://rounddate.pl/?language=en", {
      headers: {
        cookie: "rounddate-locale=pl",
      },
    });

    expect(getRequestLocaleFromRequest(request)).toBe("en");
  });

  it("supports the lang query alias and falls back to the locale cookie", () => {
    expect(getRequestLocaleFromRequest(new Request("https://rounddate.pl/?lang=eu"))).toBe("en");
    expect(
      getRequestLocaleFromRequest(
        new Request("https://rounddate.pl/", {
          headers: {
            cookie: "rounddate-locale=en",
          },
        }),
      ),
    ).toBe("en");
  });
});
