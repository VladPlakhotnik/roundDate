import "server-only";

import { eq } from "drizzle-orm";

import type { Locale } from "@/shared/i18n/locales";
import { getDb } from "@/shared/server/db/client";
import { profiles } from "@/shared/server/db/schema";

import { sendEmail, type SendEmailInput } from "./send-email";
import {
  eventReminderEmail,
  eventResultEmail,
  marketingEmail,
  newEventsEmail,
  type EmailEventCard,
} from "./templates";

type NotificationPreference =
  | "eventReminderNotifications"
  | "eventResultNotifications"
  | "marketingConsent";

type SkippedEmailResult = {
  delivered: false;
  providerMessageId: null;
  skipped: "notification-disabled";
};

type NotificationResult = Awaited<ReturnType<typeof sendEmail>> | SkippedEmailResult;

const defaultPreferences = {
  eventReminderNotifications: true,
  eventResultNotifications: true,
  marketingConsent: false,
} satisfies Record<NotificationPreference, boolean>;

async function isNotificationEnabled(userId: string, preference: NotificationPreference) {
  const [profile] = await getDb()
    .select({
      eventReminderNotifications: profiles.eventReminderNotifications,
      eventResultNotifications: profiles.eventResultNotifications,
      marketingConsent: profiles.marketingConsent,
    })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  return profile?.[preference] ?? defaultPreferences[preference];
}

async function sendProfileNotification(
  preference: NotificationPreference,
  input: SendEmailInput,
): Promise<NotificationResult> {
  if (input.userId && !(await isNotificationEnabled(input.userId, preference))) {
    return {
      delivered: false,
      providerMessageId: null,
      skipped: "notification-disabled",
    };
  }

  return sendEmail(input);
}

export async function sendEventReminderNotification(input: {
  attendeeNumber?: number | string | undefined;
  ageRange?: string | undefined;
  detailsUrl?: string | undefined;
  eventDate: string;
  eventTime?: string | undefined;
  eventTitle: string;
  eventUrl?: string | undefined;
  imageSrc?: string | undefined;
  locale?: Locale | string | null | undefined;
  metadata?: Record<string, unknown>;
  priceLabel?: string | undefined;
  spotsLabel?: string | undefined;
  to: string;
  userId: string;
  venueAddress?: string | undefined;
  venueName: string;
}) {
  const template = eventReminderEmail({
    ageRange: input.ageRange,
    attendeeNumber: input.attendeeNumber,
    detailsUrl: input.detailsUrl,
    eventDate: input.eventDate,
    eventTime: input.eventTime,
    eventTitle: input.eventTitle,
    eventUrl: input.eventUrl,
    imageSrc: input.imageSrc,
    locale: input.locale,
    priceLabel: input.priceLabel,
    spotsLabel: input.spotsLabel,
    venueAddress: input.venueAddress,
    venueName: input.venueName,
  });

  return sendProfileNotification("eventReminderNotifications", {
    ...template,
    metadata: {
      ...input.metadata,
      eventTitle: input.eventTitle,
      notificationActionUrl: input.detailsUrl ?? "/profile/bookings",
    },
    template: "event-reminder",
    to: input.to,
    userId: input.userId,
  });
}

export async function sendEventResultNotification(input: {
  eventTitle: string;
  locale?: Locale | string | null | undefined;
  matchCount?: number | undefined;
  metadata?: Record<string, unknown>;
  resultsUrl: string;
  to: string;
  userId: string;
}) {
  const template = eventResultEmail({
    eventTitle: input.eventTitle,
    locale: input.locale,
    ...(typeof input.matchCount === "number" ? { matchCount: input.matchCount } : {}),
    resultsUrl: input.resultsUrl,
  });

  return sendProfileNotification("eventResultNotifications", {
    ...template,
    metadata: {
      ...input.metadata,
      eventTitle: input.eventTitle,
      notificationActionUrl: input.resultsUrl,
    },
    template: "event-result",
    to: input.to,
    userId: input.userId,
  });
}

export async function sendMarketingNotification(input: {
  ctaUrl: string;
  headline: string;
  locale?: Locale | string | null | undefined;
  metadata?: Record<string, unknown>;
  text: string;
  to: string;
  userId: string;
}) {
  const template = marketingEmail({
    ctaUrl: input.ctaUrl,
    headline: input.headline,
    locale: input.locale,
    text: input.text,
  });

  return sendProfileNotification("marketingConsent", {
    ...template,
    metadata: {
      ...input.metadata,
      notificationActionUrl: input.ctaUrl,
    },
    template: "marketing",
    to: input.to,
    userId: input.userId,
  });
}

export async function sendNewEventsNotification(input: {
  events?: EmailEventCard[] | undefined;
  eventsUrl: string;
  locale?: Locale | string | null | undefined;
  metadata?: Record<string, unknown>;
  to: string;
  userId: string;
}) {
  const template = newEventsEmail({
    events: input.events,
    eventsUrl: input.eventsUrl,
    locale: input.locale,
  });

  return sendProfileNotification("marketingConsent", {
    ...template,
    metadata: {
      ...input.metadata,
      notificationActionUrl: input.eventsUrl,
      notificationType: "new-events",
    },
    template: "new-events",
    to: input.to,
    userId: input.userId,
  });
}
