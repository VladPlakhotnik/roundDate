import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("drizzle-orm", () => ({
  and: vi.fn(),
  count: vi.fn(),
  desc: vi.fn(),
  eq: vi.fn(),
  isNull: vi.fn(),
}));

vi.mock("@/shared/server/db/client", () => ({
  getDb: vi.fn(),
}));

vi.mock("@/shared/server/db/schema", () => ({
  notifications: {},
}));

import { getEmailSiteNotification } from "./site-notifications";

describe("getEmailSiteNotification", () => {
  it("maps the combined new-events email to one profile notification type", () => {
    expect(
      getEmailSiteNotification({
        metadata: { notificationActionUrl: "/profile/events" },
        subject: "RoundDate: nowe wydarzenia",
        template: "new-events",
      }),
    ).toEqual({
      actionUrl: "/profile/events",
      body: "Dodaliśmy nowe wydarzenia dopasowane do Twoich preferencji.",
      title: "Nowe wydarzenia",
      tone: "coral",
      type: "new-events",
    });
  });
});
