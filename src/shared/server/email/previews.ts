import {
  accountVerificationEmail,
  eventReminderEmail,
  eventResultEmail,
  newEventsEmail,
  passwordResetEmail,
  type EmailTemplate,
} from "@/shared/server/email/templates";
import { resolveLocale, type Locale } from "@/shared/i18n/locales";

export type PreviewEmail = {
  description: string;
  id: string;
  template: EmailTemplate;
  title: string;
};

export function getPreviewEmails(localeInput?: Locale | string | null): PreviewEmail[] {
  const locale = resolveLocale(localeInput);
  const isEnglish = locale === "en";
  const firstEventDate = isEnglish ? "May 24" : "24 maja";
  const secondEventDate = isEnglish ? "May 31" : "31 maja";
  const firstEventSpots = isEnglish ? "8 seats" : "8 miejsc";
  const secondEventSpots = isEnglish ? "5 seats" : "5 miejsc";

  return [
    {
      description: "Rejestracja albo zmiana adresu email.",
      id: "account-verification",
      template: accountVerificationEmail({
        locale,
        name: "Anna",
        verificationUrl: "https://rounddate.pl/api/auth/verify-email?token=preview",
      }),
      title: "Potwierdzenie email",
    },
    {
      description: "Reset hasla po prosbie uzytkownika.",
      id: "password-reset",
      template: passwordResetEmail({
        locale,
        name: "Anna",
        resetUrl: "https://rounddate.pl/reset-password?token=preview",
      }),
      title: "Odzyskiwanie hasla",
    },
    {
      description: "Przypomnienie wysylane przed wydarzeniem.",
      id: "event-reminder",
      template: eventReminderEmail({
        ageRange: "25-35",
        attendeeNumber: 12,
        detailsUrl: "https://rounddate.pl/profile/bookings",
        eventDate: firstEventDate,
        eventTime: "19:00",
        eventTitle: "RoundDate 25-35",
        eventUrl: "https://rounddate.pl/profile/events",
        imageSrc: "/assets/home-events/chairs-date.png",
        locale,
        priceLabel: "129 PLN",
        spotsLabel: firstEventSpots,
        venueAddress: "ul. Chlebnicka 10/11, Gdansk",
        venueName: "Restaurant&Bar Stary Spichlerz",
      }),
      title: "Przypomnienie o wydarzeniu",
    },
    {
      description: "Wyniki po wydarzeniu i dostepne wzajemne sympatie.",
      id: "event-result",
      template: eventResultEmail({
        eventTitle: "RoundDate 25-35",
        locale,
        matchCount: 3,
        resultsUrl: "https://rounddate.pl/profile/matches",
      }),
      title: "Wyniki wydarzenia",
    },
    {
      description: "Manualna kampania do osob z wlaczonym marketing opt-in.",
      id: "new-events",
      template: newEventsEmail({
        events: [
          {
            ageRange: "25-35",
            eventDate: firstEventDate,
            eventTime: "19:00",
            eventUrl: "https://rounddate.pl/profile/events",
            imageSrc: "/assets/home-events/chairs-date.png",
            priceLabel: "129 PLN",
            spotsLabel: firstEventSpots,
            title: "RoundDate 25-35",
            venueAddress: "ul. Chlebnicka 10/11, Gdansk",
            venueName: "Restaurant&Bar Stary Spichlerz",
          },
          {
            ageRange: "30-40",
            eventDate: secondEventDate,
            eventTime: "18:30",
            eventUrl: "https://rounddate.pl/profile/events",
            imageSrc: "/assets/home-events/chairs-flowers.png",
            priceLabel: "139 PLN",
            spotsLabel: secondEventSpots,
            title: "RoundDate 30-40",
            venueAddress: "al. Grunwaldzka 472C, Gdansk",
            venueName: "Olivia Star",
          },
        ],
        eventsUrl: "https://rounddate.pl/profile/events",
        locale,
      }),
      title: "Nowe wydarzenia",
    },
  ];
}

export function getPreviewEmail(id: string, localeInput?: Locale | string | null) {
  return getPreviewEmails(localeInput).find((email) => email.id === id);
}
