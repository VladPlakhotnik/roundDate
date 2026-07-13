import { describe, expect, it, vi } from "vitest";

import { disposeHeroRenderer, isHeroEditorSearchEnabled } from "./HeroChairScene";

describe("HeroChairScene editor controls", () => {
  it("keeps the editor hidden unless it is explicitly requested in the URL", () => {
    expect(isHeroEditorSearchEnabled("")).toBe(false);
    expect(isHeroEditorSearchEnabled("?count=3")).toBe(false);
    expect(isHeroEditorSearchEnabled("?heroEditor=1")).toBe(true);
    expect(isHeroEditorSearchEnabled("?heroEditor=true")).toBe(true);
  });
});

describe("HeroChairScene WebGL lifecycle", () => {
  it("disposes renderer resources without forcing a reusable canvas context to be lost", () => {
    const renderer = {
      dispose: vi.fn(),
      forceContextLoss: vi.fn(),
    };

    disposeHeroRenderer(renderer);

    expect(renderer.dispose).toHaveBeenCalledOnce();
    expect(renderer.forceContextLoss).not.toHaveBeenCalled();
  });
});
