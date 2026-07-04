import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/admin/auth/require-admin", () => ({
  requireAdmin: mocks.requireAdmin,
}));

import { GET } from "./route";

describe("GET /api/geocoding/reverse", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("requires an admin before reverse geocoding", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));

    vi.stubGlobal("fetch", fetchMock);
    mocks.requireAdmin.mockRejectedValue(new Error("admin required"));

    await expect(
      GET(new Request("http://localhost/api/geocoding/reverse?lat=54.344&lon=18.654")),
    ).rejects.toThrow("admin required");

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
