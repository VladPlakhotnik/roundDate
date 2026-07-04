import { describe, expect, it } from "vitest";

import { isHeroEditorSearchEnabled } from "./HeroChairScene";

describe("HeroChairScene editor controls", () => {
  it("keeps the editor hidden unless it is explicitly requested in the URL", () => {
    expect(isHeroEditorSearchEnabled("")).toBe(false);
    expect(isHeroEditorSearchEnabled("?count=3")).toBe(false);
    expect(isHeroEditorSearchEnabled("?heroEditor=1")).toBe(true);
    expect(isHeroEditorSearchEnabled("?heroEditor=true")).toBe(true);
  });
});
