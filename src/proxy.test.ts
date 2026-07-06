import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { localeCookieName } from "@/shared/i18n/locales";

import { proxy } from "./proxy";

function createRequest(url: string) {
  return new NextRequest(url);
}

describe("proxy", () => {
  it("sets baseline security headers for normal page requests", () => {
    const response = proxy(createRequest("https://rounddate.pl/profile"));

    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    expect(response.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(response.headers.get("Permissions-Policy")).toBe(
      "camera=(), geolocation=(), microphone=()",
    );
  });

  it("keeps marketing locale persistence while applying security headers", () => {
    const response = proxy(createRequest("https://rounddate.pl/?language=eu"));

    expect(response.headers.get("Set-Cookie")).toContain(`${localeCookieName}=en`);
    expect(response.headers.get("Set-Cookie")).toContain("Secure");
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
  });
});
