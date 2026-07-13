import "server-only";

import { contactEmail } from "@/shared/config/contact";
import { resolveLocale, type Locale } from "@/shared/i18n/locales";

export type EmailTemplate = {
  assets?: EmailAsset[];
  html: string;
  subject: string;
  text: string;
};

export type EmailAsset = {
  contentType: string;
  filePath: string;
  publicPath: string;
};

type EmailAction = {
  label: string;
  url: string;
};

type EmailShellInput = {
  action?: EmailAction | undefined;
  afterHeroHtml?: string | undefined;
  assets?: EmailAsset[] | undefined;
  bodyHtml: string;
  bodyText: string[];
  footerNote?: string | undefined;
  hero?: EmailHero | undefined;
  headline: string;
  locale: Locale;
  noteHtml?: string | undefined;
  preheader: string;
  subject: string;
  title: string;
};

type EmailHero = {
  alt: string;
  asset: EmailAsset;
  width: number;
};

type EventDetailsInput = {
  attendeeNumber?: number | string | undefined;
  ageRange?: string | undefined;
  eventDate: string;
  eventTime?: string | undefined;
  eventTitle: string;
  eventUrl?: string | undefined;
  imageSrc?: string | undefined;
  locale?: Locale | string | null | undefined;
  priceLabel?: string | undefined;
  spotsLabel?: string | undefined;
  venueAddress?: string | undefined;
  venueName: string;
};

export type EmailEventCard = {
  ageRange?: string | undefined;
  city?: string | undefined;
  eventDate?: string | undefined;
  eventTime?: string | undefined;
  eventUrl?: string | undefined;
  imageSrc?: string | undefined;
  priceLabel?: string | undefined;
  spotsLabel?: string | undefined;
  title: string;
  venueAddress?: string | undefined;
  venueName?: string | undefined;
};

const supportEmail = contactEmail;
const defaultEmailPublicUrl = "https://rounddate.pl";
const emailFontFamily = "'Manrope','Google Sans','Roboto','Helvetica Neue',Arial,sans-serif";
const logoAsset = {
  contentType: "image/png",
  filePath: "public/assets/brand/rounddate-logo-email.png",
  publicPath: "/assets/brand/rounddate-logo-email.png",
} satisfies EmailAsset;
const heroAssets = {
  calendar: {
    contentType: "image/png",
    filePath: "public/assets/email/rounddate-calendar-hero.png",
    publicPath: "/assets/email/rounddate-calendar-hero.png",
  },
  envelope: {
    contentType: "image/png",
    filePath: "public/assets/email/rounddate-envelope-hero-sm.png",
    publicPath: "/assets/email/rounddate-envelope-hero-sm.png",
  },
  heart: {
    contentType: "image/png",
    filePath: "public/assets/email/rounddate-heart-hero.png",
    publicPath: "/assets/email/rounddate-heart-hero.png",
  },
  lock: {
    contentType: "image/png",
    filePath: "public/assets/email/rounddate-lock-hero.png",
    publicPath: "/assets/email/rounddate-lock-hero.png",
  },
} satisfies Record<string, EmailAsset>;
const defaultEventImageSrc = "/assets/atmosphere/conversation-03.png";
export const newEventsDefaultDescription =
  "Wybraliśmy kilka najbliższych spotkań RoundDate. Sprawdź daty, miejsca i grupy wiekowe, a potem wybierz termin dla siebie.";
const emailCopy = {
  en: {
    accountVerification: {
      action: "Confirm email",
      alt: "RoundDate envelope",
      body: "Click the button below to confirm this email address for your RoundDate account.",
      fallbackGreeting: "Hi!",
      headline: "Confirm your email",
      note: "If you did not create an account in RoundDate, you can safely ignore this message.",
      preheader: "Confirm the email address for your RoundDate account.",
      subject: "RoundDate: confirm email",
      title: "RoundDate - Email confirmation",
    },
    eventCard: {
      age: "Age",
      date: "Date",
      details: "Event",
      detailsFallback: "Details are available in your RoundDate profile",
      location: "Location",
    },
    eventDetails: {
      address: "Address",
      attendeeNumber: "Participant number",
      date: "Date",
      location: "Location",
    },
    eventReminder: {
      action: "See details",
      alt: "RoundDate calendar",
      body: "Tomorrow you have {eventTitle}.",
      bodySecond: "Arrive a little earlier and get ready for a relaxed evening of conversations.",
      closing: "See you there. It will be interesting.",
      headline: "Your event is coming up",
      identity: "Arrive 15-20 minutes before the start and bring an ID.",
      preheader: "Reminder: {eventTitle}",
      subject: "RoundDate: reminder - {eventTitle}",
      textIntro: "Reminder for event: {eventTitle}.",
      title: "RoundDate - Event reminder",
    },
    eventResult: {
      action: "See results",
      alt: "RoundDate hearts",
      contacts: "Contacts are shown only when the like was mutual.",
      contactsShort: "Contacts are shown only for mutual likes.",
      fallbackMatch: "Results are now available in your profile.",
      headline: "Results are available",
      matchMany: "You have {count} mutual matches.",
      matchOne: "You have 1 mutual match.",
      preheader: "Results for {eventTitle} are ready.",
      subject: "RoundDate: results - {eventTitle}",
      textIntro: "Results for {eventTitle} are now available.",
      title: "RoundDate - Event results",
    },
    footer: {
      contact: "Have questions? We are at",
      rights: "© 2026 RoundDate. All rights reserved.",
      settings: "Notification settings",
      unsubscribe: "Unsubscribe",
    },
    marketing: {
      action: "Open RoundDate",
      alt: "RoundDate",
    },
    newEvents: {
      action: "See details",
      alt: "RoundDate calendar",
      description:
        "We selected a few upcoming RoundDate meetings. Check dates, locations and age groups, then choose the right evening for you.",
      headline: "New RoundDate events",
      note: "See the dates before the seats are reserved.",
      preheader: "New RoundDate dates and events.",
      subject: "RoundDate: new events",
      title: "RoundDate - New events",
    },
    passwordReset: {
      action: "Set new password",
      alt: "Secure RoundDate account",
      body: "We received a request to set a new password for your account.",
      bodySecond: "If this was you, use the button below. The link is time-limited.",
      fallbackGreeting: "Hi!",
      headline: "Password recovery",
      note: "For security, do not share this link with anyone.",
      preheader: "Set a new password for your RoundDate account.",
      subject: "RoundDate: password reset",
      title: "RoundDate - Password reset",
    },
  },
  pl: {
    accountVerification: {
      action: "Potwierdź email",
      alt: "Koperta RoundDate",
      body: "Kliknij przycisk poniżej, aby potwierdzić ten adres email dla konta RoundDate.",
      fallbackGreeting: "Cześć!",
      headline: "Potwierdź swój email",
      note: "Jeśli to nie Ty zakładałeś konto w RoundDate, możesz bezpiecznie zignorować tę wiadomość.",
      preheader: "Potwierdź adres email dla konta RoundDate.",
      subject: "RoundDate: potwierdz email",
      title: "RoundDate - Potwierdzenie email",
    },
    eventCard: {
      age: "Wiek",
      date: "Data",
      details: "Wydarzenie",
      detailsFallback: "Szczegóły znajdziesz w profilu RoundDate",
      location: "Miejsce",
    },
    eventDetails: {
      address: "Adres",
      attendeeNumber: "Numer uczestnika",
      date: "Data",
      location: "Miejsce",
    },
    eventReminder: {
      action: "Zobacz szczegóły",
      alt: "Kalendarz RoundDate",
      body: "Jutro czeka Cię wydarzenie {eventTitle}.",
      bodySecond: "Przyjdź chwilę wcześniej i przygotuj się na spokojny wieczór rozmów.",
      closing: "Do zobaczenia. Będzie ciekawie.",
      headline: "Twoje wydarzenie już blisko",
      identity: "Przyjdź 15-20 minut przed startem i zabierz dokument tożsamości.",
      preheader: "Przypomnienie: {eventTitle}",
      subject: "RoundDate: przypomnienie - {eventTitle}",
      textIntro: "Przypominamy o wydarzeniu: {eventTitle}.",
      title: "RoundDate - Przypomnienie o wydarzeniu",
    },
    eventResult: {
      action: "Zobacz wyniki",
      alt: "Serca RoundDate",
      contacts: "Kontakty pokazujemy tylko wtedy, gdy sympatia była wzajemna.",
      contactsShort: "Kontakty pokazujemy tylko przy wzajemnej sympatii.",
      fallbackMatch: "Wyniki są już dostępne w Twoim profilu.",
      headline: "Wyniki są dostępne",
      matchMany: "Masz {count} wzajemne dopasowania.",
      matchOne: "Masz 1 wzajemne dopasowanie.",
      preheader: "Wyniki wydarzenia {eventTitle} są gotowe.",
      subject: "RoundDate: wyniki - {eventTitle}",
      textIntro: "Wyniki wydarzenia {eventTitle} są już dostępne.",
      title: "RoundDate - Wyniki wydarzenia",
    },
    footer: {
      contact: "Masz pytania? Jesteśmy pod adresem",
      rights: "© 2026 RoundDate. Wszystkie prawa zastrzeżone.",
      settings: "Ustawienia powiadomień",
      unsubscribe: "Wypisz się",
    },
    marketing: {
      action: "Otwórz RoundDate",
      alt: "RoundDate",
    },
    newEvents: {
      action: "Zobacz szczegóły",
      alt: "Kalendarz RoundDate",
      description: newEventsDefaultDescription,
      headline: "Nowe wydarzenia RoundDate",
      note: "Zobacz terminy, zanim miejsca zostaną zarezerwowane.",
      preheader: "Nowe daty i wydarzenia RoundDate.",
      subject: "RoundDate: nowe wydarzenia",
      title: "RoundDate - Nowe wydarzenia",
    },
    passwordReset: {
      action: "Ustaw nowe hasło",
      alt: "Bezpieczne konto RoundDate",
      body: "Otrzymaliśmy prośbę o ustawienie nowego hasła do Twojego konta.",
      bodySecond:
        "Jeśli to była Twoja prośba, użyj przycisku poniżej. Link jest ograniczony czasowo.",
      fallbackGreeting: "Cześć!",
      headline: "Odzyskiwanie hasła",
      note: "Dla bezpieczeństwa nie przekazuj tego linku innym osobom.",
      preheader: "Ustaw nowe hasło do konta RoundDate.",
      subject: "RoundDate: reset hasla",
      title: "RoundDate - Reset hasla",
    },
  },
} satisfies Record<Locale, Record<string, unknown>>;
const socialAssets = {
  facebook: {
    contentType: "image/png",
    filePath: "public/assets/email/social-facebook.png",
    publicPath: "/assets/email/social-facebook.png",
  },
  instagram: {
    contentType: "image/png",
    filePath: "public/assets/email/social-instagram.png",
    publicPath: "/assets/email/social-instagram.png",
  },
} satisfies Record<string, EmailAsset>;
const socialLinks = [
  {
    asset: socialAssets.instagram,
    href: "https://www.instagram.com/rounddategdansk",
    label: "Instagram",
  },
  {
    asset: socialAssets.facebook,
    href: "https://www.facebook.com/rounddategdansk",
    label: "Facebook",
  },
];

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function templateLocale(value: Locale | string | null | undefined) {
  return resolveLocale(value);
}

function templateCopy(locale: Locale) {
  return emailCopy[locale];
}

function formatCopy(template: string, values: Record<string, number | string>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match,
  );
}

function isLocalUrl(value: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::|\/|$)/i.test(value);
}

function appUrl() {
  const configuredUrl = process.env.EMAIL_PUBLIC_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  const publicUrl =
    configuredUrl && !isLocalUrl(configuredUrl) ? configuredUrl : defaultEmailPublicUrl;

  return publicUrl.replace(/\/$/, "");
}

function assetUrl(asset: EmailAsset) {
  return `${appUrl()}${asset.publicPath}`;
}

function publicUrl(value: string) {
  const trimmedValue = value.trim();

  if (/^https?:\/\//i.test(trimmedValue)) {
    if (!isLocalUrl(trimmedValue)) {
      return trimmedValue;
    }

    return `${appUrl()}${new URL(trimmedValue).pathname}`;
  }

  const publicPath = trimmedValue.startsWith("/") ? trimmedValue : `/${trimmedValue}`;

  return `${appUrl()}${publicPath}`;
}

function localPublicAsset(value: string): EmailAsset | null {
  const trimmedValue = value.trim();

  if (!trimmedValue.startsWith("/")) {
    return null;
  }

  const publicPath = trimmedValue.split(/[?#]/, 1)[0] ?? "";
  const extension = publicPath.split(".").pop()?.toLowerCase();
  const contentType =
    extension === "jpg" || extension === "jpeg"
      ? "image/jpeg"
      : extension === "webp"
        ? "image/webp"
        : extension === "png"
          ? "image/png"
          : null;

  if (!publicPath || !contentType) {
    return null;
  }

  return {
    contentType,
    filePath: `public${publicPath}`,
    publicPath,
  };
}

function isEmailAsset(asset: EmailAsset | null): asset is EmailAsset {
  return asset !== null;
}

function paragraph(text: string) {
  return `<p style="margin:0 auto;max-width:560px;color:#5f6973;font-size:15px;font-weight:500;line-height:1.72;text-align:center;">${escapeHtml(text)}</p>`;
}

function spacer(height: number) {
  return `<div style="height:${height}px;line-height:${height}px;font-size:${height}px;">&nbsp;</div>`;
}

function actionButton(action: EmailAction) {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto;">
      <tr>
        <td style="border-radius:999px;background:#ff5a52;box-shadow:0 14px 26px rgba(252,66,56,0.22);">
          <a href="${escapeHtml(action.url)}" style="display:inline-block;min-width:214px;padding:15px 28px;border-radius:999px;background:#ff5a52;color:#ffffff;font-size:14px;font-weight:700;line-height:1;text-align:center;text-decoration:none;">
            ${escapeHtml(action.label)}
          </a>
        </td>
      </tr>
    </table>`;
}

function emailLogo() {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto;">
      <tr>
        <td style="padding:0 10px 0 0;vertical-align:middle;">
          <img src="${escapeHtml(assetUrl(logoAsset))}" width="44" height="44" alt="" style="display:block;width:44px;height:44px;border:0;outline:none;text-decoration:none;" />
        </td>
        <td style="vertical-align:middle;color:#111317;font-size:22px;font-weight:800;line-height:1;">
          RoundDate
        </td>
      </tr>
    </table>`;
}

function renderHero(hero: EmailHero) {
  return `
    <div style="padding:6px 0 0;background:#ffffff;text-align:center;">
      <img src="${escapeHtml(assetUrl(hero.asset))}" width="${hero.width}" alt="${escapeHtml(hero.alt)}" style="display:block;width:100%;max-width:${hero.width}px;height:auto;margin:0 auto;border:0;outline:none;text-decoration:none;" />
    </div>`;
}

function detailRow(label: string, value: string) {
  return `
    <tr>
      <td style="padding:8px 0;color:#7b828a;font-size:13px;font-weight:700;line-height:1.35;text-transform:uppercase;letter-spacing:0.04em;">${escapeHtml(label)}</td>
      <td style="padding:8px 0;color:#111317;font-size:14px;font-weight:700;line-height:1.45;text-align:right;">${escapeHtml(value)}</td>
    </tr>`;
}

function eventDateLabel(event: EmailEventCard) {
  return [event.eventDate, event.eventTime].filter(Boolean).join(", ");
}

function eventVenueLabel(event: EmailEventCard) {
  return [event.venueName, event.venueAddress ?? event.city].filter(Boolean).join(", ");
}

function eventCardRows(event: EmailEventCard, locale: Locale) {
  const copy = templateCopy(locale).eventCard;
  const rows = [
    eventDateLabel(event) ? eventCardMetaRow("date", copy.date, eventDateLabel(event)) : "",
    eventVenueLabel(event) ? eventCardMetaRow("venue", copy.location, eventVenueLabel(event)) : "",
  ].join("");

  return rows || eventCardMetaRow("details", copy.details, copy.detailsFallback);
}

function eventCardMetaRow(kind: string, label: string, value: string) {
  return `
    <tr data-email-event-card-meta="${escapeHtml(kind)}">
      <td style="padding:0 0 7px;text-align:left;">
        <div style="color:#fc4238;font-size:11px;font-weight:900;line-height:1.25;text-align:left;text-transform:uppercase;letter-spacing:0.03em;">${escapeHtml(label)}</div>
        <div style="margin-top:2px;color:#111317;font-size:14px;font-weight:850;line-height:1.35;text-align:left;">${escapeHtml(value)}</div>
      </td>
    </tr>`;
}

function eventCardPills(event: EmailEventCard, locale: Locale) {
  const copy = templateCopy(locale).eventCard;
  const pills = [
    event.ageRange ? `${copy.age} ${event.ageRange}` : "",
    event.priceLabel ? event.priceLabel : "",
    event.spotsLabel ? event.spotsLabel : "",
  ].filter(Boolean);

  if (!pills.length) {
    return "";
  }

  return `
    <div data-email-event-card-pills="true" style="margin-top:5px;text-align:left;">
      ${pills
        .map(
          (pill) =>
            `<span style="display:inline-block;margin:5px 5px 0 0;border:1px solid #ffe1dc;border-radius:999px;background:#fff7f5;color:#fc4238;font-size:12px;font-weight:850;line-height:1;padding:7px 9px;">${escapeHtml(pill)}</span>`,
        )
        .join("")}
    </div>`;
}

function renderEventCard(event: EmailEventCard, locale: Locale) {
  const imageSrc = event.imageSrc?.trim() || defaultEventImageSrc;
  const imageUrl = publicUrl(imageSrc);
  const titleHtml = escapeHtml(event.title);

  return `
    <table data-email-event-card="true" data-email-event-card-layout="compact-row" role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;margin:0 auto;border:1px solid #ffe1dc;border-radius:18px;background:#ffffff;overflow:hidden;">
      <tr>
        <td data-email-event-card-media="center" width="154" align="center" valign="middle" style="width:154px;padding:12px;background:#fff7f5;text-align:center;vertical-align:middle;">
          <img src="${escapeHtml(imageUrl)}" width="130" height="104" alt="${titleHtml}" style="display:block;width:130px;max-width:130px;height:104px;margin:0 auto;border:0;border-radius:14px;object-fit:cover;object-position:center;outline:none;text-decoration:none;" />
        </td>
        <td style="padding:14px 17px 15px;text-align:left;vertical-align:middle;">
          <div style="margin:0 0 10px;color:#111317;font-size:17px;font-weight:900;line-height:1.25;text-align:left;">${titleHtml}</div>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            ${eventCardRows(event, locale)}
          </table>
          ${eventCardPills(event, locale)}
        </td>
      </tr>
    </table>`;
}

function renderEventCards(events: EmailEventCard[], locale: Locale) {
  return events.map((event) => renderEventCard(event, locale)).join(spacer(14));
}

function eventCardsText(events: EmailEventCard[]) {
  return events.map((event) =>
    [
      event.title,
      eventDateLabel(event),
      eventVenueLabel(event),
      event.priceLabel,
      event.spotsLabel,
      event.eventUrl,
    ]
      .filter(Boolean)
      .join(" - "),
  );
}

function eventDetailsCard(input: EventDetailsInput, locale: Locale) {
  const copy = templateCopy(locale).eventDetails;
  const dateValue = input.eventTime ? `${input.eventDate}, ${input.eventTime}` : input.eventDate;
  const rows = [
    detailRow(copy.date, dateValue),
    detailRow(copy.location, input.venueName),
    input.venueAddress ? detailRow(copy.address, input.venueAddress) : "",
    input.attendeeNumber ? detailRow(copy.attendeeNumber, String(input.attendeeNumber)) : "",
  ].join("");

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;margin:0 auto;border:1px solid #ffe1dc;border-radius:18px;background:#ffffff;">
      <tr>
        <td style="padding:19px 20px;">
          <div style="margin:0 0 10px;color:#111317;font-size:17px;font-weight:800;line-height:1.25;text-align:left;">${escapeHtml(input.eventTitle)}</div>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            ${rows}
          </table>
        </td>
      </tr>
    </table>`;
}

function notice(text: string) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;margin:0 auto;border-radius:18px;background:#fff7f5;">
      <tr>
        <td style="padding:16px 18px;color:#5f6973;font-size:12px;font-weight:600;line-height:1.6;text-align:center;">
          ${escapeHtml(text)}
        </td>
      </tr>
    </table>`;
}

function socialIconLinks() {
  const cells = socialLinks
    .map(
      (link) =>
        `<td style="padding:0 7px;"><a href="${escapeHtml(link.href)}" aria-label="${escapeHtml(link.label)}" style="display:inline-block;width:36px;height:36px;border:1px solid #ffe8e4;border-radius:999px;background:#ffffff;text-align:center;text-decoration:none;"><img src="${escapeHtml(assetUrl(link.asset))}" width="18" height="18" alt="" style="display:block;width:18px;height:18px;margin:9px auto 0;border:0;outline:none;text-decoration:none;" /></a></td>`,
    )
    .join("");

  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto;"><tr>${cells}</tr></table>`;
}

function renderEmail(input: EmailShellInput): EmailTemplate {
  const copy = templateCopy(input.locale).footer;
  const actionHtml = input.action ? `${spacer(16)}${actionButton(input.action)}` : "";
  const heroHtml = input.hero ? renderHero(input.hero) : "";
  const afterHeroHtml = input.afterHeroHtml ? `${spacer(18)}${input.afterHeroHtml}` : "";
  const noteHtml = input.noteHtml ? `${spacer(18)}${input.noteHtml}` : "";
  const assets = [
    logoAsset,
    socialAssets.instagram,
    socialAssets.facebook,
    ...(input.hero ? [input.hero.asset] : []),
    ...(input.assets ?? []),
  ];

  const html = `<!doctype html>
<html lang="${input.locale}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
    </style>
    <title>${escapeHtml(input.title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#ffffff;color:#111317;font-family:${emailFontFamily};-webkit-text-size-adjust:100%;text-size-adjust:100%;">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">${escapeHtml(input.preheader)}</span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;">
      <tr>
        <td align="center" style="padding:0 12px 18px;">
          <table role="presentation" width="720" cellspacing="0" cellpadding="0" border="0" style="width:720px;max-width:100%;border-collapse:separate;border-spacing:0;">
            <tr>
              <td style="background:#ffffff;overflow:hidden;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="padding:0 32px 32px;text-align:center;">
                      ${emailLogo()}
                      ${spacer(14)}
                      <h1 style="margin:0 auto;max-width:600px;color:#080c0f;font-size:28px;font-weight:800;line-height:1.16;text-align:center;">${escapeHtml(input.headline)}</h1>
                      ${spacer(10)}
                      ${input.bodyHtml}
                      ${heroHtml}
                      ${afterHeroHtml}
                      ${actionHtml}
                      ${noteHtml}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:28px 32px 34px;background:#ffffff;text-align:center;border-top:1px solid #fff4f2;">
                      <div style="color:#5f6973;font-size:14px;font-weight:700;line-height:1.6;">${escapeHtml(copy.contact)}</div>
                      <a href="mailto:${supportEmail}" style="display:inline-block;margin-top:6px;color:#fc4238;font-size:14px;font-weight:800;text-decoration:none;">${supportEmail}</a>
                      <div style="margin-top:20px;">${socialIconLinks()}</div>
                      <div style="margin-top:22px;color:#7b828a;font-size:12px;font-weight:650;line-height:1.55;">${escapeHtml(copy.rights)}</div>
                      <div style="margin-top:10px;color:#7b828a;font-size:12px;font-weight:650;line-height:1.55;">
                        <a href="${appUrl()}/profile/settings" style="color:#5f6973;text-decoration:underline;">${escapeHtml(copy.settings)}</a>
                        <span style="color:#d9b7b1;padding:0 7px;">•</span>
                        <a href="${appUrl()}/profile/settings" style="color:#5f6973;text-decoration:underline;">${escapeHtml(copy.unsubscribe)}</a>
                      </div>
                      ${input.footerNote ? `<div style="margin-top:12px;color:#9aa1aa;font-size:11px;font-weight:600;line-height:1.5;">${escapeHtml(input.footerNote)}</div>` : ""}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    input.headline,
    "",
    ...input.bodyText,
    ...(input.action ? ["", `${input.action.label}: ${input.action.url}`] : []),
    "",
    `${input.locale === "en" ? "Contact" : "Kontakt"}: ${supportEmail}`,
    `${copy.settings}: ${appUrl()}/profile/settings`,
  ].join("\n");

  return {
    assets,
    html,
    subject: input.subject,
    text,
  };
}

export function accountVerificationEmail(input: {
  locale?: Locale | string | null | undefined;
  name?: string | null;
  verificationUrl: string;
}) {
  const locale = templateLocale(input.locale);
  const copy = templateCopy(locale).accountVerification;
  const greeting = input.name
    ? locale === "en"
      ? `Hi, ${input.name}!`
      : `Cześć, ${input.name}!`
    : copy.fallbackGreeting;
  const body = [greeting, copy.body];

  return renderEmail({
    action: {
      label: copy.action,
      url: input.verificationUrl,
    },
    bodyHtml: [
      `<p style="margin:0;color:#fc4238;font-size:16px;font-weight:850;line-height:1.6;">${escapeHtml(greeting)}</p>`,
      spacer(14),
      paragraph(copy.body),
    ].join(""),
    bodyText: body,
    hero: {
      alt: copy.alt,
      asset: heroAssets.envelope,
      width: 360,
    },
    headline: copy.headline,
    locale,
    noteHtml: notice(copy.note),
    preheader: copy.preheader,
    subject: copy.subject,
    title: copy.title,
  });
}

export function passwordResetEmail(input: {
  locale?: Locale | string | null | undefined;
  name?: string | null;
  resetUrl: string;
}) {
  const locale = templateLocale(input.locale);
  const copy = templateCopy(locale).passwordReset;
  const greeting = input.name
    ? locale === "en"
      ? `Hi, ${input.name}!`
      : `Cześć, ${input.name}!`
    : copy.fallbackGreeting;
  const body = [greeting, copy.body, copy.bodySecond];

  return renderEmail({
    action: {
      label: copy.action,
      url: input.resetUrl,
    },
    bodyHtml: [
      `<p style="margin:0;color:#fc4238;font-size:16px;font-weight:850;line-height:1.6;">${escapeHtml(greeting)}</p>`,
      spacer(14),
      paragraph(copy.body),
      spacer(10),
      paragraph(copy.bodySecond),
    ].join(""),
    bodyText: body,
    hero: {
      alt: copy.alt,
      asset: heroAssets.lock,
      width: 300,
    },
    headline: copy.headline,
    locale,
    noteHtml: notice(copy.note),
    preheader: copy.preheader,
    subject: copy.subject,
    title: copy.title,
  });
}

export function eventReminderEmail(input: EventDetailsInput & { detailsUrl?: string | undefined }) {
  const locale = templateLocale(input.locale);
  const copy = templateCopy(locale).eventReminder;
  const greeting = locale === "en" ? "Hi!" : "Cześć!";
  const eventCard =
    input.imageSrc || input.ageRange || input.priceLabel || input.spotsLabel || input.eventUrl
      ? {
          ageRange: input.ageRange,
          eventDate: input.eventDate,
          eventTime: input.eventTime,
          eventUrl: input.eventUrl ?? input.detailsUrl,
          imageSrc: input.imageSrc,
          priceLabel: input.priceLabel,
          spotsLabel: input.spotsLabel,
          title: input.eventTitle,
          venueAddress: input.venueAddress,
          venueName: input.venueName,
        }
      : null;
  const body = [
    greeting,
    formatCopy(copy.textIntro, { eventTitle: input.eventTitle }),
    `${locale === "en" ? "Date and location" : "Data i miejsce"}: ${input.eventDate}${input.eventTime ? `, ${input.eventTime}` : ""}, ${input.venueName}.`,
    copy.identity,
    ...(eventCard ? eventCardsText([eventCard]) : []),
  ];

  return renderEmail({
    action: input.detailsUrl
      ? {
          label: copy.action,
          url: input.detailsUrl,
        }
      : undefined,
    afterHeroHtml: eventCard ? renderEventCard(eventCard, locale) : eventDetailsCard(input, locale),
    assets: eventCard?.imageSrc ? [localPublicAsset(eventCard.imageSrc)].filter(isEmailAsset) : [],
    bodyHtml: [
      `<p style="margin:0;color:#fc4238;font-size:15px;font-weight:850;line-height:1.6;">${escapeHtml(greeting)}</p>`,
      spacer(14),
      paragraph(formatCopy(copy.body, { eventTitle: input.eventTitle })),
      spacer(10),
      paragraph(copy.bodySecond),
    ].join(""),
    bodyText: body,
    hero: {
      alt: copy.alt,
      asset: heroAssets.calendar,
      width: 360,
    },
    headline: copy.headline,
    locale,
    noteHtml: paragraph(copy.closing),
    preheader: formatCopy(copy.preheader, { eventTitle: input.eventTitle }),
    subject: formatCopy(copy.subject, { eventTitle: input.eventTitle }),
    title: copy.title,
  });
}

export function eventResultEmail(input: {
  eventTitle: string;
  locale?: Locale | string | null | undefined;
  matchCount?: number;
  resultsUrl: string;
}) {
  const locale = templateLocale(input.locale);
  const copy = templateCopy(locale).eventResult;
  const greeting = locale === "en" ? "Hi!" : "Cześć!";
  const matchText =
    typeof input.matchCount === "number"
      ? input.matchCount === 1
        ? copy.matchOne
        : formatCopy(copy.matchMany, { count: input.matchCount })
      : copy.fallbackMatch;
  const body = [
    greeting,
    formatCopy(copy.textIntro, { eventTitle: input.eventTitle }),
    matchText,
    copy.contacts,
  ];

  return renderEmail({
    action: {
      label: copy.action,
      url: input.resultsUrl,
    },
    afterHeroHtml: `<div style="margin:0 auto;max-width:560px;border:1px solid #ffe8e4;border-radius:18px;background:#fff7f5;padding:20px;text-align:center;">
        <div style="color:#fc4238;font-size:38px;font-weight:950;line-height:1;">${typeof input.matchCount === "number" ? input.matchCount : "✓"}</div>
        <div style="margin-top:8px;color:#111317;font-size:16px;font-weight:900;line-height:1.35;">${escapeHtml(matchText)}</div>
        <div style="margin-top:8px;color:#5f6973;font-size:13px;font-weight:650;line-height:1.5;">${escapeHtml(copy.contactsShort)}</div>
      </div>`,
    bodyHtml: [
      `<p style="margin:0;color:#fc4238;font-size:15px;font-weight:850;line-height:1.6;">${escapeHtml(greeting)}</p>`,
      spacer(14),
      paragraph(formatCopy(copy.textIntro, { eventTitle: input.eventTitle })),
      spacer(10),
      paragraph(copy.contacts),
    ].join(""),
    bodyText: body,
    hero: {
      alt: copy.alt,
      asset: heroAssets.heart,
      width: 360,
    },
    headline: copy.headline,
    locale,
    preheader: formatCopy(copy.preheader, { eventTitle: input.eventTitle }),
    subject: formatCopy(copy.subject, { eventTitle: input.eventTitle }),
    title: copy.title,
  });
}

export function marketingEmail(input: {
  ctaUrl: string;
  headline: string;
  locale?: Locale | string | null | undefined;
  text: string;
}) {
  const locale = templateLocale(input.locale);
  const copy = templateCopy(locale).marketing;

  return renderEmail({
    action: {
      label: copy.action,
      url: input.ctaUrl,
    },
    bodyHtml: paragraph(input.text),
    bodyText: [input.text],
    hero: {
      alt: copy.alt,
      asset: heroAssets.heart,
      width: 360,
    },
    headline: input.headline,
    locale,
    preheader: input.headline,
    subject: input.headline,
    title: input.headline,
  });
}

export function newEventsEmail(input: {
  events?: EmailEventCard[] | undefined;
  eventsUrl: string;
  locale?: Locale | string | null | undefined;
}) {
  const locale = templateLocale(input.locale);
  const copy = templateCopy(locale).newEvents;
  const eventCards = input.events?.slice(0, 6) ?? [];
  const eventsHtml = eventCards.length ? renderEventCards(eventCards, locale) : "";

  return renderEmail({
    action: {
      label: copy.action,
      url: input.eventsUrl,
    },
    afterHeroHtml: eventsHtml,
    bodyHtml: paragraph(copy.description),
    bodyText: [copy.description, ...eventCardsText(eventCards)],
    assets: eventCards
      .map((event) => (event.imageSrc ? localPublicAsset(event.imageSrc) : null))
      .filter(isEmailAsset),
    hero: {
      alt: copy.alt,
      asset: heroAssets.calendar,
      width: 360,
    },
    headline: copy.headline,
    locale,
    noteHtml: notice(copy.note),
    preheader: copy.preheader,
    subject: copy.subject,
    title: copy.title,
  });
}
