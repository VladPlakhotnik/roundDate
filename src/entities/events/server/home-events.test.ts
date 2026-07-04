import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/shared/server/db/client", () => ({
  getDb: vi.fn(() => {
    throw new Error("Database unavailable");
  }),
}));

import { getEvents } from "./home-events";

describe("home events server data", () => {
  it("can disable seed fallback for production landing data", async () => {
    const events = await getEvents({
      limit: 3,
      statuses: ["published"],
      useFallback: false,
    } as Parameters<typeof getEvents>[0] & { useFallback: false });

    expect(events).toEqual([]);
  });
});
