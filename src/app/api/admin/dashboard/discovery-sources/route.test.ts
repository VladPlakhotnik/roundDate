import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAdminDiscoverySourceStats: vi.fn(),
  normalizeAdminDiscoverySourcePeriod: vi.fn(),
  requireAdmin: vi.fn(),
}));

vi.mock("@/admin/auth/require-admin", () => ({
  requireAdmin: mocks.requireAdmin,
}));

vi.mock("@/admin/server/dashboard", () => ({
  getAdminDiscoverySourceStats: mocks.getAdminDiscoverySourceStats,
  normalizeAdminDiscoverySourcePeriod: mocks.normalizeAdminDiscoverySourcePeriod,
}));

import { GET } from "./route";

describe("GET /api/admin/dashboard/discovery-sources", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("requires an admin and loads discovery source stats for the requested period", async () => {
    mocks.normalizeAdminDiscoverySourcePeriod.mockReturnValue("today");
    mocks.getAdminDiscoverySourceStats.mockResolvedValue({
      data: [],
      period: "today",
      total: 0,
    });

    const response = await GET(
      new Request("http://localhost/api/admin/dashboard/discovery-sources?period=today"),
    );

    expect(mocks.requireAdmin).toHaveBeenCalledOnce();
    expect(mocks.normalizeAdminDiscoverySourcePeriod).toHaveBeenCalledWith("today");
    expect(mocks.getAdminDiscoverySourceStats).toHaveBeenCalledWith("today");
    await expect(response.json()).resolves.toEqual({
      data: [],
      period: "today",
      total: 0,
    });
  });

  it("does not load stats when admin access is rejected", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("admin required"));

    await expect(
      GET(new Request("http://localhost/api/admin/dashboard/discovery-sources?period=week")),
    ).rejects.toThrow("admin required");

    expect(mocks.getAdminDiscoverySourceStats).not.toHaveBeenCalled();
  });
});
