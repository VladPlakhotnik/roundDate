import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  eq: vi.fn(),
  from: vi.fn(),
  limit: vi.fn(),
  sendEmail: vi.fn(),
  select: vi.fn(),
  where: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("drizzle-orm", () => ({
  eq: mocks.eq,
}));

vi.mock("@/shared/server/db/client", () => ({
  getDb: () => ({
    select: mocks.select,
  }),
}));

vi.mock("@/shared/server/db/schema", () => ({
  profiles: {
    eventCriteriaNotifications: "profiles.eventCriteriaNotifications",
    eventReminderNotifications: "profiles.eventReminderNotifications",
    eventResultNotifications: "profiles.eventResultNotifications",
    marketingConsent: "profiles.marketingConsent",
    newDateNotifications: "profiles.newDateNotifications",
    userId: "profiles.userId",
  },
}));

vi.mock("./send-email", () => ({
  sendEmail: mocks.sendEmail,
}));

vi.mock("./templates", () => ({
  eventReminderEmail: vi.fn(),
  eventResultEmail: vi.fn(),
  marketingEmail: vi.fn(),
  newEventsEmail: vi.fn(() => ({
    html: "<p>New events</p>",
    subject: "RoundDate: nowe wydarzenia",
    text: "New events",
  })),
}));

import { sendNewEventsNotification } from "./notifications";
import { newEventsEmail } from "./templates";

describe("email notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.eq.mockReturnValue({ kind: "eq" });
    mocks.select.mockReturnValue({ from: mocks.from });
    mocks.from.mockReturnValue({ where: mocks.where });
    mocks.where.mockReturnValue({ limit: mocks.limit });
    mocks.sendEmail.mockResolvedValue({ delivered: true, providerMessageId: "email-1" });
  });

  it("skips new events email when marketing consent is disabled", async () => {
    mocks.limit.mockResolvedValue([
      {
        eventCriteriaNotifications: true,
        eventReminderNotifications: true,
        eventResultNotifications: true,
        marketingConsent: false,
        newDateNotifications: true,
      },
    ]);

    await expect(
      sendNewEventsNotification({
        eventsUrl: "https://rounddate.example/events",
        to: "anna@example.com",
        userId: "user-1",
      }),
    ).resolves.toEqual({
      delivered: false,
      providerMessageId: null,
      skipped: "notification-disabled",
    });
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("sends one combined new-events template when marketing consent is enabled", async () => {
    mocks.limit.mockResolvedValue([
      {
        eventCriteriaNotifications: true,
        eventReminderNotifications: true,
        eventResultNotifications: true,
        marketingConsent: true,
        newDateNotifications: true,
      },
    ]);

    await sendNewEventsNotification({
      events: [
        {
          eventDate: "24 maja",
          imageSrc: "/assets/home-events/chairs-date.png",
          title: "RoundDate 25-35",
          venueName: "Stary Spichlerz",
        },
      ],
      eventsUrl: "https://rounddate.example/events",
      locale: "en",
      metadata: { campaignId: "campaign-1" },
      to: "anna@example.com",
      userId: "user-1",
    });

    const templateInput = vi.mocked(newEventsEmail).mock.calls[0]?.[0];

    expect(templateInput).toEqual(
      expect.objectContaining({
        events: [
          expect.objectContaining({
            imageSrc: "/assets/home-events/chairs-date.png",
            title: "RoundDate 25-35",
          }),
        ],
        eventsUrl: "https://rounddate.example/events",
        locale: "en",
      }),
    );
    expect(templateInput).not.toHaveProperty("summary");
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          campaignId: "campaign-1",
          notificationActionUrl: "https://rounddate.example/events",
          notificationType: "new-events",
        }),
        template: "new-events",
        to: "anna@example.com",
        userId: "user-1",
      }),
    );
  });
});
