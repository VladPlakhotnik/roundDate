import "server-only";

import { and, count, desc, eq, isNull } from "drizzle-orm";

import { getDb } from "@/shared/server/db/client";
import { notifications } from "@/shared/server/db/schema";

export type SiteNotificationTone = "coral" | "info" | "success" | "warning";

export type SiteNotificationDraft = {
  actionUrl?: string | null | undefined;
  body: string;
  dedupeKey?: string | null | undefined;
  metadata?: Record<string, unknown> | undefined;
  title: string;
  tone?: SiteNotificationTone | undefined;
  type: string;
};

export type SiteNotification = {
  actionUrl: null | string;
  body: string;
  createdAt: Date;
  id: string;
  readAt: Date | null;
  title: string;
  tone: string;
  type: string;
};

function metadataString(metadata: Record<string, unknown> | undefined, key: string) {
  const value = metadata?.[key];

  return typeof value === "string" && value ? value : null;
}

function notificationActionUrl(metadata: Record<string, unknown> | undefined, fallback: string) {
  return (
    metadataString(metadata, "notificationActionUrl") ??
    metadataString(metadata, "actionUrl") ??
    fallback
  );
}

export function getEmailSiteNotification(input: {
  metadata?: Record<string, unknown> | undefined;
  subject: string;
  template: string;
}): SiteNotificationDraft | null {
  switch (input.template) {
    case "account-verification":
      return {
        actionUrl: "/profile/settings",
        body: "Wyslalismy link do potwierdzenia adresu email.",
        title: "Potwierdz email",
        tone: "success",
        type: "account-verification",
      };
    case "password-reset":
      return {
        actionUrl: "/profile/settings",
        body: "Wyslalismy link do ustawienia nowego hasla.",
        title: "Reset hasla",
        tone: "warning",
        type: "password-reset",
      };
    case "event-reminder":
      return {
        actionUrl: notificationActionUrl(input.metadata, "/profile/bookings"),
        body: "Przypominamy o zblizajacym sie wydarzeniu.",
        title: metadataString(input.metadata, "eventTitle") ?? "Przypomnienie o wydarzeniu",
        tone: "coral",
        type: "event-reminder",
      };
    case "event-result":
      return {
        actionUrl: notificationActionUrl(input.metadata, "/profile/matches"),
        body: "Wyniki wydarzenia sa juz dostepne w profilu.",
        title: metadataString(input.metadata, "eventTitle") ?? "Wyniki sa dostepne",
        tone: "success",
        type: "event-result",
      };
    case "marketing":
      return {
        actionUrl: notificationActionUrl(input.metadata, "/profile/events"),
        body: input.subject,
        title: "RoundDate",
        tone: "info",
        type: "marketing",
      };
    case "new-events":
    case "new-date":
    case "new-events-by-criteria":
      return {
        actionUrl: notificationActionUrl(input.metadata, "/profile/events"),
        body: "Dodaliśmy nowe wydarzenia dopasowane do Twoich preferencji.",
        title: "Nowe wydarzenia",
        tone: "coral",
        type: input.template,
      };
    default:
      return null;
  }
}

export async function createSiteNotification(input: SiteNotificationDraft & { userId: string }) {
  const now = new Date();
  const insert = getDb()
    .insert(notifications)
    .values({
      actionUrl: input.actionUrl ?? null,
      body: input.body,
      createdAt: now,
      dedupeKey: input.dedupeKey ?? null,
      metadata: input.metadata,
      title: input.title,
      tone: input.tone ?? "info",
      type: input.type,
      updatedAt: now,
      userId: input.userId,
    });

  if (!input.dedupeKey) {
    await insert;
    return;
  }

  await insert.onConflictDoNothing({
    target: [notifications.userId, notifications.dedupeKey],
  });
}

export async function listSiteNotifications(userId: string, limit = 20) {
  return getDb()
    .select({
      actionUrl: notifications.actionUrl,
      body: notifications.body,
      createdAt: notifications.createdAt,
      id: notifications.id,
      readAt: notifications.readAt,
      title: notifications.title,
      tone: notifications.tone,
      type: notifications.type,
    })
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function countUnreadSiteNotifications(userId: string) {
  const [row] = await getDb()
    .select({ count: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));

  return row?.count ?? 0;
}

export async function markSiteNotificationsRead(userId: string) {
  const now = new Date();

  await getDb()
    .update(notifications)
    .set({
      readAt: now,
      updatedAt: now,
    })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
}
