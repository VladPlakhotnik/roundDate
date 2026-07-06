import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getEvents: vi.fn(),
}));

vi.mock("@/entities/events", () => ({
  getEvents: mocks.getEvents,
}));

describe("sitemap", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://rounddate.pl");
    mocks.getEvents.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("includes public static routes and published event routes", async () => {
    mocks.getEvents.mockResolvedValue([
      {
        slug: "speed-dating-25-35-2031-05-24",
        startsAt: "2031-05-24T17:00:00.000Z",
        updatedAt: "2031-05-01T10:00:00.000Z",
      },
    ]);

    const { default: sitemap } = await import("./sitemap");
    const entries = await sitemap();

    expect(mocks.getEvents).toHaveBeenCalledWith({
      limit: 100,
      statuses: ["published"],
      useFallback: false,
    });
    expect(entries.map((entry) => entry.url)).toEqual([
      "https://rounddate.pl/",
      "https://rounddate.pl/regulamin",
      "https://rounddate.pl/privacy",
      "https://rounddate.pl/wydarzenia/speed-dating-25-35-2031-05-24",
    ]);
    expect(entries[3]?.lastModified).toEqual(new Date("2031-05-01T10:00:00.000Z"));
  });
});
