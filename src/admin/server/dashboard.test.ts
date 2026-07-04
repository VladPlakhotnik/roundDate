import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/shared/server/db/client", () => ({
  getDb: vi.fn(),
}));

import {
  createDiscoverySourceDistribution,
  getDiscoverySourcePeriodStart,
  normalizeAdminDiscoverySourcePeriod,
} from "./dashboard";

describe("admin dashboard discovery sources", () => {
  it("aggregates source counts and keeps percentages stable", () => {
    expect(
      createDiscoverySourceDistribution([
        { source: "instagram", value: 3 },
        { source: "friend", value: 2 },
        { source: null, value: 1 },
        { source: "tiktok", value: 0 },
      ]),
    ).toEqual([
      {
        color: "#f04438",
        count: 3,
        label: "Instagram",
        percentage: 50,
        source: "instagram",
      },
      {
        color: "#16a34a",
        count: 2,
        label: "Polecenie znajomego",
        percentage: 33.3,
        source: "friend",
      },
      {
        color: "#94a3b8",
        count: 1,
        label: "Не указано",
        percentage: 16.7,
        source: "unknown",
      },
    ]);
  });

  it("resolves discovery source period starts", () => {
    const now = new Date("2026-06-30T15:45:00.000Z");

    expect(getDiscoverySourcePeriodStart("all", now)).toBeNull();
    expect(getDiscoverySourcePeriodStart("today", now)?.toISOString()).toBe(
      "2026-06-29T22:00:00.000Z",
    );
    expect(getDiscoverySourcePeriodStart("week", now)?.toISOString()).toBe(
      "2026-06-23T15:45:00.000Z",
    );
    expect(getDiscoverySourcePeriodStart("month", now)?.toISOString()).toBe(
      "2026-05-31T15:45:00.000Z",
    );
  });

  it("normalizes invalid discovery source periods to all time", () => {
    expect(normalizeAdminDiscoverySourcePeriod("today")).toBe("today");
    expect(normalizeAdminDiscoverySourcePeriod("quarter")).toBe("all");
    expect(normalizeAdminDiscoverySourcePeriod(null)).toBe("all");
  });
});
