import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSettingsSession: vi.fn(),
  insert: vi.fn(),
  onConflictDoUpdate: vi.fn(),
  profiles: {
    userId: "profiles.userId",
  },
  values: vi.fn(),
}));

vi.mock("@/shared/server/db/client", () => ({
  getDb: () => ({
    insert: mocks.insert,
  }),
}));

vi.mock("@/shared/server/db/schema", () => ({
  profiles: mocks.profiles,
}));

vi.mock("../_utils", () => ({
  getSettingsSession: mocks.getSettingsSession,
  getSettingsTranslator: () => (key: string) => key,
  jsonError: (message: string, status = 400) => Response.json({ error: message }, { status }),
  readJson: async (request: Request) => request.json().catch(() => null),
}));

import { PATCH } from "./route";

describe("PATCH /api/profile/settings/notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.getSettingsSession.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    mocks.insert.mockReturnValue({ values: mocks.values });
    mocks.values.mockReturnValue({ onConflictDoUpdate: mocks.onConflictDoUpdate });
    mocks.onConflictDoUpdate.mockResolvedValue(undefined);
  });

  it("persists the combined new events preference across legacy marketing fields", async () => {
    const response = await PATCH(
      new Request("https://rounddate.example/api/profile/settings/notifications", {
        body: JSON.stringify({
          eventReminderNotifications: false,
          eventResultNotifications: true,
          newEventNotifications: true,
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      }),
    );

    await expect(response.json()).resolves.toEqual({
      ok: true,
      preferences: {
        eventReminderNotifications: false,
        eventResultNotifications: true,
        newEventNotifications: true,
      },
    });
    expect(mocks.values).toHaveBeenCalledWith(
      expect.objectContaining({
        emailNotifications: true,
        eventCriteriaNotifications: true,
        eventReminderNotifications: false,
        eventResultNotifications: true,
        marketingConsent: true,
        newDateNotifications: true,
        userId: "user-1",
      }),
    );
    expect(mocks.onConflictDoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        set: expect.objectContaining({
          emailNotifications: true,
          eventCriteriaNotifications: true,
          eventReminderNotifications: false,
          eventResultNotifications: true,
          marketingConsent: true,
          newDateNotifications: true,
        }),
        target: "profiles.userId",
      }),
    );
  });
});
