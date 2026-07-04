import { NextResponse } from "next/server";

import { getRequestTranslatorFromRequest } from "@/shared/i18n/server";
import { getAuth } from "@/shared/server/auth/auth";
import {
  countUnreadSiteNotifications,
  listSiteNotifications,
  markSiteNotificationsRead,
} from "@/shared/server/notifications/site-notifications";

export const runtime = "nodejs";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function serializeDate(date: Date | null) {
  return date ? date.toISOString() : null;
}

export async function GET(request: Request) {
  const t = getRequestTranslatorFromRequest(request);
  const session = await getAuth().api.getSession({ headers: request.headers });

  if (!session?.user) {
    return jsonError(t("api.common.unauthorized"), 401);
  }

  const [notifications, unreadCount] = await Promise.all([
    listSiteNotifications(session.user.id),
    countUnreadSiteNotifications(session.user.id),
  ]);

  return NextResponse.json({
    notifications: notifications.map((notification) => ({
      ...notification,
      createdAt: serializeDate(notification.createdAt),
      readAt: serializeDate(notification.readAt),
    })),
    unreadCount,
  });
}

export async function PATCH(request: Request) {
  const t = getRequestTranslatorFromRequest(request);
  const session = await getAuth().api.getSession({ headers: request.headers });

  if (!session?.user) {
    return jsonError(t("api.common.unauthorized"), 401);
  }

  await markSiteNotificationsRead(session.user.id);

  return NextResponse.json({ ok: true });
}
