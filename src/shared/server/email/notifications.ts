import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "@/shared/server/db/client";
import { profiles } from "@/shared/server/db/schema";

import { sendEmail, type SendEmailInput } from "./send-email";
import { eventReminderEmail, eventResultEmail, marketingEmail, newEventsEmail } from "./templates";

type NotificationPreference =
  | "eventCriteriaNotifications"
  | "eventReminderNotifications"
  | "eventResultNotifications"
  | "marketingConsent"
  | "newDateNotifications";

type SkippedEmailResult = {
  delivered: false;
  providerMessageId: null;
  skipped: "notification-disabled";
};

type NotificationResult = Awaited<ReturnType<typeof sendEmail>> | SkippedEmailResult;

const defaultPreferences = {
  eventCriteriaNotifications: true,
  eventReminderNotifications: true,
  eventResultNotifications: true,
  marketingConsent: false,
  newDateNotifications: true,
} satisfies Record<NotificationPreference, boolean>;

async function isNotificationEnabled(userId: string, preference: NotificationPreference) {
  const [profile] = await getDb()
    .select({
      eventCriteriaNotifications: profiles.eventCriteriaNotifications,
      eventReminderNotifications: profiles.eventReminderNotifications,
      eventResultNotifications: profiles.eventResultNotifications,
      marketingConsent: profiles.marketingConsent,
      newDateNotifications: profiles.newDateNotifications,
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
  eventDate: string;
  eventTitle: string;
  metadata?: Record<string, unknown>;
  to: string;
  userId: string;
  venueName: string;
}) {
  const template = eventReminderEmail({
    eventDate: input.eventDate,
    eventTitle: input.eventTitle,
    venueName: input.venueName,
  });

  return sendProfileNotification("eventReminderNotifications", {
    ...template,
    metadata: input.metadata ?? {},
    template: "event-reminder",
    to: input.to,
    userId: input.userId,
  });
}

export async function sendEventResultNotification(input: {
  eventTitle: string;
  metadata?: Record<string, unknown>;
  resultsUrl: string;
  to: string;
  userId: string;
}) {
  const template = eventResultEmail({
    eventTitle: input.eventTitle,
    resultsUrl: input.resultsUrl,
  });

  return sendProfileNotification("eventResultNotifications", {
    ...template,
    metadata: input.metadata ?? {},
    template: "event-result",
    to: input.to,
    userId: input.userId,
  });
}

export async function sendMarketingNotification(input: {
  ctaUrl: string;
  headline: string;
  metadata?: Record<string, unknown>;
  text: string;
  to: string;
  userId: string;
}) {
  const template = marketingEmail({
    ctaUrl: input.ctaUrl,
    headline: input.headline,
    text: input.text,
  });

  return sendProfileNotification("marketingConsent", {
    ...template,
    metadata: input.metadata ?? {},
    template: "marketing",
    to: input.to,
    userId: input.userId,
  });
}

export async function sendNewEventsNotification(input: {
  eventsUrl: string;
  metadata?: Record<string, unknown>;
  summary: string;
  to: string;
  type: "criteria" | "new-date";
  userId: string;
}) {
  const template = newEventsEmail({
    eventsUrl: input.eventsUrl,
    summary: input.summary,
  });
  const preference =
    input.type === "new-date" ? "newDateNotifications" : "eventCriteriaNotifications";

  return sendProfileNotification(preference, {
    ...template,
    metadata: {
      ...input.metadata,
      notificationType: input.type,
    },
    template: input.type === "new-date" ? "new-date" : "new-events-by-criteria",
    to: input.to,
    userId: input.userId,
  });
}
