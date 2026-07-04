import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { sendNewEventsCampaign } from "./marketing-campaigns";

describe("sendNewEventsCampaign", () => {
  it("sends one new-events campaign to opted-in profiles and deduped newsletter recipients", async () => {
    const deps = {
      createCampaign: vi.fn(async () => true),
      finishCampaign: vi.fn(async () => undefined),
      getEvents: vi.fn(async () => [
        {
          ageMax: 35,
          ageMin: 25,
          city: "Gdansk",
          currency: "PLN",
          id: "event-1",
          imageSrc: "/assets/home-events/chairs-date.png",
          priceGroszy: 12900,
          slug: "rounddate-25-35",
          spotsAvailable: 8,
          startsAt: new Date("2026-08-01T17:00:00.000Z"),
          title: "RoundDate 25-35",
          venueAddress: "ul. Chlebnicka 10/11",
          venueName: "Stary Spichlerz",
        },
      ]),
      getNewsletterRecipients: vi.fn(async () => [
        { email: "anna@example.com", firstName: "Newsletter Anna", locale: "pl" },
        { email: "mark@example.com", firstName: "Mark", locale: "en" },
      ]),
      getProfileRecipients: vi.fn(async () => [
        { email: "Anna@Example.com", firstName: "Anna", locale: "pl", userId: "user-1" },
        { email: "ewa@example.com", firstName: "Ewa", locale: "pl", userId: "user-2" },
      ]),
      recordAuditLog: vi.fn(async () => undefined),
      sendNewsletterEmail: vi.fn(async () => ({ delivered: true, providerMessageId: "email-n" })),
      sendProfileNotification: vi.fn(async () => ({
        delivered: true,
        providerMessageId: "email-p",
      })),
    };

    await expect(
      sendNewEventsCampaign(
        {
          actor: {
            email: "admin@example.com",
            id: "admin-1",
            name: "Admin",
          },
          campaignId: "11111111-1111-4111-8111-111111111111",
          eventIds: ["event-1"],
        },
        deps,
      ),
    ).resolves.toMatchObject({
      failedCount: 0,
      newsletterRecipientCount: 1,
      profileRecipientCount: 2,
      recipientCount: 3,
      sentCount: 3,
      status: "sent",
    });
    expect(deps.createCampaign).toHaveBeenCalledWith(
      expect.objectContaining({
        campaignId: "11111111-1111-4111-8111-111111111111",
        recipientCount: 3,
        summary: expect.stringContaining("najbliższych spotkań RoundDate"),
      }),
    );
    expect(deps.sendProfileNotification).toHaveBeenCalledTimes(2);
    expect(deps.sendNewsletterEmail).toHaveBeenCalledTimes(1);
    expect(deps.sendNewsletterEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        campaignId: "11111111-1111-4111-8111-111111111111",
        events: [
          expect.objectContaining({
            imageSrc: "/assets/home-events/chairs-date.png",
            title: "RoundDate 25-35",
          }),
        ],
        locale: "en",
        to: "mark@example.com",
      }),
    );
    expect(deps.sendProfileNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        locale: "pl",
        to: "Anna@Example.com",
        userId: "user-1",
      }),
    );
    expect(deps.sendNewsletterEmail).toHaveBeenCalledWith(
      expect.not.objectContaining({
        summary: expect.any(String),
      }),
    );
    expect(deps.finishCampaign).toHaveBeenCalledWith(
      expect.objectContaining({
        failedCount: 0,
        sentCount: 3,
        status: "sent",
      }),
    );
  });

  it("does not send when the campaign id already exists", async () => {
    const deps = {
      createCampaign: vi.fn(async () => false),
      finishCampaign: vi.fn(async () => undefined),
      getEvents: vi.fn(async () => [
        {
          ageMax: 35,
          ageMin: 25,
          city: "Gdansk",
          currency: "PLN",
          id: "event-1",
          imageSrc: "/assets/home-events/chairs-date.png",
          priceGroszy: 12900,
          slug: "rounddate-25-35",
          spotsAvailable: 8,
          startsAt: new Date("2026-08-01T17:00:00.000Z"),
          title: "RoundDate 25-35",
          venueAddress: "ul. Chlebnicka 10/11",
          venueName: "Stary Spichlerz",
        },
      ]),
      getNewsletterRecipients: vi.fn(async () => [
        { email: "mark@example.com", firstName: "Mark", locale: "en" },
      ]),
      getProfileRecipients: vi.fn(async () => [
        { email: "anna@example.com", firstName: "Anna", locale: "pl", userId: "user-1" },
      ]),
      recordAuditLog: vi.fn(async () => undefined),
      sendNewsletterEmail: vi.fn(),
      sendProfileNotification: vi.fn(),
    };

    await expect(
      sendNewEventsCampaign(
        {
          actor: {
            email: "admin@example.com",
            id: "admin-1",
            name: "Admin",
          },
          campaignId: "11111111-1111-4111-8111-111111111111",
          eventIds: ["event-1"],
        },
        deps,
      ),
    ).resolves.toMatchObject({
      status: "duplicate",
      sentCount: 0,
    });
    expect(deps.sendProfileNotification).not.toHaveBeenCalled();
    expect(deps.sendNewsletterEmail).not.toHaveBeenCalled();
    expect(deps.finishCampaign).not.toHaveBeenCalled();
  });
});
