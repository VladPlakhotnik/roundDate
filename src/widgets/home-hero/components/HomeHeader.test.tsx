import { describe, expect, it } from "vitest";

import { shouldSmoothScrollLogoClick } from "./HomeHeader";

describe("HomeHeader", () => {
  it("smooth-scrolls the logo only on the landing page", () => {
    expect(shouldSmoothScrollLogoClick("/")).toBe(true);
    expect(shouldSmoothScrollLogoClick("/regulamin")).toBe(false);
    expect(shouldSmoothScrollLogoClick("/privacy")).toBe(false);
  });
});
