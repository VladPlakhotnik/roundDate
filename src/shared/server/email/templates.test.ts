import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  accountVerificationEmail,
  eventReminderEmail,
  eventResultEmail,
  newEventsEmail,
  passwordResetEmail,
} from "./templates";

describe("email templates", () => {
  it("renders branded Polish transactional templates", () => {
    const templates = [
      accountVerificationEmail({
        name: "Anna",
        verificationUrl: "https://rounddate.example/verify",
      }),
      passwordResetEmail({
        name: "Anna",
        resetUrl: "https://rounddate.example/reset",
      }),
      eventReminderEmail({
        eventDate: "24 maja",
        eventTime: "19:00",
        eventTitle: "RoundDate 25-35",
        venueName: "Stary Spichlerz",
      }),
      eventResultEmail({
        eventTitle: "RoundDate 25-35",
        matchCount: 3,
        resultsUrl: "https://rounddate.example/profile/matches",
      }),
    ];

    for (const template of templates) {
      expect(template.subject).toContain("RoundDate");
      expect(template.html).toContain('lang="pl"');
      expect(template.html).toContain("RoundDate");
      expect(template.html).toContain(
        'src="https://rounddate.pl/assets/brand/rounddate-logo-email.png"',
      );
      expect(template.html).not.toContain('src="cid:');
      expect(template.html).not.toContain('src="http://localhost');
      expect(template.assets).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            filePath: "public/assets/brand/rounddate-logo-email.png",
            publicPath: "/assets/brand/rounddate-logo-email.png",
          }),
        ]),
      );
      expect(template.assets?.length).toBeGreaterThanOrEqual(2);
      expect(template.html).toContain("hello@rounddate.pl");
      expect(template.html).toContain('aria-label="Instagram"');
      expect(template.html).toContain('aria-label="Facebook"');
      expect(template.html).toContain("social-instagram.png");
      expect(template.html).toContain("social-facebook.png");
      expect(template.html).not.toContain("Telegram");
      expect(template.html).not.toContain("TikTok");
      expect(template.assets).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            contentType: "image/png",
            filePath: "public/assets/email/social-instagram.png",
          }),
          expect.objectContaining({
            contentType: "image/png",
            filePath: "public/assets/email/social-facebook.png",
          }),
        ]),
      );
      expect(template.text).toContain("Kontakt: hello@rounddate.pl");
    }
  });

  it("does not leak localhost links into delivered email chrome", () => {
    const originalPublicUrl = process.env.EMAIL_PUBLIC_URL;
    const originalNextPublicAppUrl = process.env.NEXT_PUBLIC_APP_URL;

    delete process.env.EMAIL_PUBLIC_URL;
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:6670";

    try {
      const template = eventResultEmail({
        eventTitle: "RoundDate 25-35",
        resultsUrl: "https://rounddate.example/profile/matches",
      });

      expect(template.html).toContain("https://rounddate.pl/profile/settings");
      expect(template.text).toContain("https://rounddate.pl/profile/settings");
      expect(template.html).not.toContain("http://localhost:6670/profile/settings");
    } finally {
      if (originalPublicUrl === undefined) {
        delete process.env.EMAIL_PUBLIC_URL;
      } else {
        process.env.EMAIL_PUBLIC_URL = originalPublicUrl;
      }

      if (originalNextPublicAppUrl === undefined) {
        delete process.env.NEXT_PUBLIC_APP_URL;
      } else {
        process.env.NEXT_PUBLIC_APP_URL = originalNextPublicAppUrl;
      }
    }
  });

  it("renders event reminder details and compact closing copy", () => {
    const template = eventReminderEmail({
      attendeeNumber: 12,
      detailsUrl: "https://rounddate.example/profile/bookings",
      eventDate: "24 maja",
      eventTime: "19:00",
      eventTitle: "RoundDate 25-35",
      venueAddress: "ul. Chlebnicka 10/11, Gdańsk",
      venueName: "Stary Spichlerz",
    });

    expect(template.subject).toBe("RoundDate: przypomnienie - RoundDate 25-35");
    expect(template.html).toContain("Numer uczestnika");
    expect(template.html).toContain("12");
    expect(template.html).toContain("Do zobaczenia");
    expect(template.html).toContain("https://rounddate.example/profile/bookings");
    expect(template.text).toContain("RoundDate 25-35");
    expect(template.text).toContain("19:00");
  });

  it("renders transactional email copy in English when locale is English", () => {
    const template = passwordResetEmail({
      locale: "en",
      name: "Anna",
      resetUrl: "https://rounddate.example/reset",
    });

    expect(template.subject).toBe("RoundDate: password reset");
    expect(template.html).toContain('lang="en"');
    expect(template.html).toContain("Password recovery");
    expect(template.html).toContain("Set new password");
    expect(template.html).toContain("Hi, Anna!");
    expect(template.text).toContain("We received a request to set a new password");
    expect(template.text).toContain("Notification settings");
    expect(template.html).not.toContain("Odzyskiwanie hasła");
  });

  it("renders event reminder as an event card with the event image", () => {
    const template = eventReminderEmail({
      ageRange: "25-35",
      attendeeNumber: 12,
      detailsUrl: "https://rounddate.example/profile/bookings",
      eventDate: "24 maja",
      eventTime: "19:00",
      eventTitle: "RoundDate 25-35",
      eventUrl: "https://rounddate.example/profile/events",
      imageSrc: "/assets/home-events/chairs-date.png",
      priceLabel: "129 PLN",
      spotsLabel: "8 miejsc",
      venueAddress: "ul. Chlebnicka 10/11, Gdańsk",
      venueName: "Stary Spichlerz",
    });

    expect(template.html).toContain('data-email-event-card="true"');
    expect(template.html).toContain('data-email-event-card-layout="compact-row"');
    expect(template.html).toContain('data-email-event-card-media="center"');
    expect(template.html).toContain('data-email-event-card-meta="date"');
    expect(template.html).toContain('data-email-event-card-pills="true"');
    expect(template.html).toContain(
      'src="https://rounddate.pl/assets/home-events/chairs-date.png"',
    );
    expect(template.html).toContain("rounddate-calendar-hero.png");
    expect(template.html).toContain("RoundDate 25-35");
    expect(template.html).toContain("25-35");
    expect(template.html).toContain("129 PLN");
    expect(template.html).toContain("8 miejsc");
    expect(template.html).not.toContain("https://rounddate.example/profile/events");
    expect(template.text).toContain("https://rounddate.example/profile/events");
    expect(template.html).not.toContain("Zobacz wydarzenie");
    expect(template.html).toContain("Zobacz szczegóły");
  });

  it("renders new events as visual event cards instead of a text-only list", () => {
    const template = newEventsEmail({
      events: [
        {
          ageRange: "25-35",
          eventDate: "24 maja",
          eventTime: "19:00",
          eventUrl: "https://rounddate.example/profile/events",
          imageSrc: "/assets/home-events/chairs-date.png",
          priceLabel: "129 PLN",
          spotsLabel: "8 miejsc",
          title: "RoundDate 25-35",
          venueName: "Stary Spichlerz",
        },
        {
          ageRange: "30-40",
          eventDate: "31 maja",
          eventTime: "18:30",
          eventUrl: "https://rounddate.example/profile/events",
          imageSrc: "/assets/home-events/chairs-flowers.png",
          priceLabel: "139 PLN",
          spotsLabel: "5 miejsc",
          title: "RoundDate 30-40",
          venueName: "Olivia Star",
        },
      ],
      eventsUrl: "https://rounddate.example/profile/events",
    });
    const heroIndex = template.html.indexOf("rounddate-calendar-hero.png");
    const firstCardIndex = template.html.indexOf('data-email-event-card="true"');

    expect(template.html.match(/data-email-event-card="true"/g)).toHaveLength(2);
    expect(template.html.match(/data-email-event-card-layout="compact-row"/g)).toHaveLength(2);
    expect(template.html.match(/data-email-event-card-media="center"/g)).toHaveLength(2);
    expect(template.html.match(/data-email-event-card-pills="true"/g)).toHaveLength(2);
    expect(heroIndex).toBeGreaterThan(-1);
    expect(firstCardIndex).toBeGreaterThan(-1);
    expect(heroIndex).toBeLessThan(firstCardIndex);
    expect(template.html).toContain(
      'src="https://rounddate.pl/assets/home-events/chairs-date.png"',
    );
    expect(template.html).toContain(
      'src="https://rounddate.pl/assets/home-events/chairs-flowers.png"',
    );
    expect(template.html).toContain("RoundDate 25-35");
    expect(template.html).toContain("RoundDate 30-40");
    expect(template.html).toContain("Stary Spichlerz");
    expect(template.html).toContain("Olivia Star");
    expect(template.html).toContain("rounddate-calendar-hero.png");
    expect(template.html).toContain("Wybraliśmy kilka najbliższych spotkań RoundDate");
    expect(template.html).not.toContain("Zobacz wydarzenie");
    expect(template.html).toContain("Zobacz szczegóły");
    expect(template.text).toContain(
      "RoundDate 25-35 - 24 maja, 19:00 - Stary Spichlerz - 129 PLN - 8 miejsc - https://rounddate.example/profile/events",
    );
  });

  it("renders new events marketing copy and event card labels in English", () => {
    const template = newEventsEmail({
      events: [
        {
          ageRange: "25-35",
          eventDate: "May 24",
          eventTime: "19:00",
          imageSrc: "/assets/home-events/chairs-date.png",
          priceLabel: "129 PLN",
          spotsLabel: "8 seats",
          title: "RoundDate 25-35",
          venueName: "Stary Spichlerz",
        },
      ],
      eventsUrl: "https://rounddate.example/profile/events",
      locale: "en",
    });

    expect(template.subject).toBe("RoundDate: new events");
    expect(template.html).toContain('lang="en"');
    expect(template.html).toContain("New RoundDate events");
    expect(template.html).toContain("We selected a few upcoming RoundDate meetings");
    expect(template.html).toContain("Date");
    expect(template.html).toContain("Location");
    expect(template.html).toContain("Age 25-35");
    expect(template.html).toContain("8 seats");
    expect(template.html).toContain("See details");
    expect(template.html).not.toContain("Nowe wydarzenia RoundDate");
  });
});
