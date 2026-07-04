import { describe, expect, it } from "vitest";

import { defaultLocale, resolveLocale, resolveLocaleFromMarketingParam } from "./locales";

describe("locales", () => {
  it("defaults to Polish", () => {
    expect(defaultLocale).toBe("pl");
    expect(resolveLocale(undefined)).toBe("pl");
  });

  it("resolves marketing language aliases from URL parameters", () => {
    expect(resolveLocaleFromMarketingParam("en")).toBe("en");
    expect(resolveLocaleFromMarketingParam("english")).toBe("en");
    expect(resolveLocaleFromMarketingParam("eng")).toBe("en");
    expect(resolveLocaleFromMarketingParam("eu")).toBe("en");
    expect(resolveLocaleFromMarketingParam("pl")).toBe("pl");
    expect(resolveLocaleFromMarketingParam("polish")).toBe("pl");
  });

  it("ignores unsupported marketing language values", () => {
    expect(resolveLocaleFromMarketingParam("de")).toBeNull();
    expect(resolveLocaleFromMarketingParam("")).toBeNull();
    expect(resolveLocaleFromMarketingParam(null)).toBeNull();
  });
});
