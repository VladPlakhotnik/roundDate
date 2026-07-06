import { afterEach, describe, expect, it, vi } from "vitest";

import { absoluteSiteUrl, getPublicSiteUrl, productionSiteUrl } from "./site";

describe("site config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not expose localhost as the public production URL", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:6670");

    expect(getPublicSiteUrl()).toBe(productionSiteUrl);
  });

  it("builds absolute URLs from the configured public origin", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://rounddate.example");

    expect(absoluteSiteUrl("/privacy")).toBe("https://rounddate.example/privacy");
  });
});
