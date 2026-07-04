import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  requireAdmin: vi.fn(),
  revalidatePath: vi.fn(),
  selectRows: [] as unknown[][],
  updateSet: vi.fn(),
  updateWhere: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("@/admin/auth/require-admin", () => ({
  requireAdmin: mocks.requireAdmin,
}));

vi.mock("@/shared/server/db/client", () => ({
  getDb: mocks.getDb,
}));

import { normalizeAdminEventFilters, updateAdminEventAction } from "./events";

function createSelectChain(rows: unknown[]) {
  const whereChain = {
    where: vi.fn(() => ({
      limit: vi.fn(async () => rows),
    })),
  };

  return {
    from: vi.fn(() => ({
      ...whereChain,
      leftJoin: vi.fn(() => whereChain),
    })),
  };
}

function createDb() {
  return {
    select: vi.fn(() => createSelectChain(mocks.selectRows.shift() ?? [])),
    update: vi.fn(() => ({
      set: mocks.updateSet.mockReturnValue({
        where: mocks.updateWhere,
      }),
    })),
  };
}

function createEditFormData() {
  const formData = new FormData();

  formData.set("eventId", "event-1");
  formData.set("title", "Updated event");
  formData.set("date", "2031-06-15");
  formData.set("time", "20:30");
  formData.set("status", "draft");
  formData.set("publicationMode", "draft");
  formData.set("adminUserId", "admin-2");
  formData.set("ageMin", "25");
  formData.set("ageMax", "35");
  formData.set("femaleCapacity", "10");
  formData.set("maleCapacity", "12");
  formData.set("spotsAvailable", "22");
  formData.set("femaleSpotsAvailable", "10");
  formData.set("maleSpotsAvailable", "12");
  formData.set("price", "149");
  formData.set("language", "RU/PL");
  formData.set("durationMinutes", "120");
  formData.set("conversationMinutes", "10");
  formData.set("coverSrc", "/assets/home-events/chairs-flowers.png");
  formData.set("venueId", "venue-2");
  formData.set("venueName", "Hotel Almond");
  formData.set("venueAddress", "ul. Torunska 12, Gdansk");
  formData.set("city", "Gdansk");
  formData.set("district", "Srodmiescie");
  formData.set("latitude", "54.344");
  formData.set("longitude", "18.654");
  formData.set("addressMode", "existing");

  return formData;
}

describe("admin event filters", () => {
  it("normalizes event search and status filters for backend queries", () => {
    expect(
      normalizeAdminEventFilters({
        q: `  ${"x".repeat(140)}  `,
        status: "published",
      }),
    ).toEqual({
      q: "x".repeat(120),
      status: "published",
    });

    expect(
      normalizeAdminEventFilters({
        q: ["Hotel"],
        status: "unknown",
      }),
    ).toEqual({
      q: "Hotel",
      status: "all",
    });
  });
});

describe("updateAdminEventAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.selectRows.length = 0;
    mocks.requireAdmin.mockResolvedValue({
      email: "request-admin@example.com",
      id: "admin-request",
      image: null,
      name: "Request Admin",
      role: "admin",
    });
  });

  it("requires an admin and persists edited cover and venue fields", async () => {
    mocks.selectRows.push(
      [{ metadata: { existing: true }, slug: "speed-dating-intro-2031-06-14" }],
      [
        {
          email: "assigned@example.com",
          firstName: "Assigned",
          id: "admin-2",
          image: "/avatar.png",
          lastName: "Admin",
          name: "Assigned Admin",
          phone: "+48111111111",
        },
      ],
      [{ city: "Gdansk", id: "venue-2" }],
    );
    mocks.getDb.mockReturnValue(createDb());

    await updateAdminEventAction(createEditFormData());

    expect(mocks.requireAdmin).toHaveBeenCalledTimes(1);
    expect(mocks.updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        city: "Gdansk",
        imageSrc: "/assets/home-events/chairs-flowers.png",
        metadata: expect.objectContaining({
          addressMode: "existing",
          existing: true,
          latitude: 54.344,
          longitude: 18.654,
        }),
        organizerEmail: "assigned@example.com",
        organizerFirstName: "Assigned",
        organizerImage: "/avatar.png",
        organizerLastName: "Admin",
        organizerPhone: "+48111111111",
        venueId: "venue-2",
      }),
    );
  });
});
