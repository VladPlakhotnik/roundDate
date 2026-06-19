import type { NextRequest } from "next/server";
import { and, eq, gte, lt, sql } from "drizzle-orm";

import { getDb } from "@/shared/server/db/client";
import {
  authUsers,
  bookings,
  emailEvents,
  events,
  profiles,
  venues,
} from "@/shared/server/db/schema";
import { sendEventReminderNotification } from "@/shared/server/email/notifications";

export const runtime = "nodejs";

function formatEventDate(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "long",
    timeZone: "Europe/Warsaw",
  }).format(date);
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return Response.json(
      {
        ok: false,
        error: "CRON_SECRET is not configured.",
      },
      { status: 503 },
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return Response.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const db = getDb();
  const now = new Date();
  const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const reminderRows = await db
    .select({
      bookingId: bookings.id,
      eventId: events.id,
      eventTitle: events.title,
      startsAt: events.startsAt,
      to: authUsers.email,
      userId: authUsers.id,
      venueName: venues.name,
    })
    .from(bookings)
    .innerJoin(authUsers, eq(bookings.userId, authUsers.id))
    .innerJoin(events, eq(bookings.eventId, events.id))
    .leftJoin(venues, eq(events.venueId, venues.id))
    .innerJoin(profiles, eq(profiles.userId, authUsers.id))
    .where(
      and(
        eq(bookings.status, "confirmed"),
        eq(profiles.emailNotifications, true),
        eq(profiles.eventReminderNotifications, true),
        gte(events.startsAt, now),
        lt(events.startsAt, windowEnd),
      ),
    );

  let queued = 0;

  for (const row of reminderRows) {
    const [existingEmail] = await db
      .select({ id: emailEvents.id })
      .from(emailEvents)
      .where(
        and(
          eq(emailEvents.template, "event-reminder"),
          sql`${emailEvents.metadata}->>'bookingId' = ${row.bookingId}`,
        ),
      )
      .limit(1);

    if (existingEmail) {
      continue;
    }

    await sendEventReminderNotification({
      eventDate: formatEventDate(row.startsAt),
      eventTitle: row.eventTitle,
      metadata: {
        bookingId: row.bookingId,
        eventId: row.eventId,
        startsAt: row.startsAt.toISOString(),
      },
      to: row.to,
      userId: row.userId,
      venueName: row.venueName ?? "SpeedDate",
    });
    queued += 1;
  }

  return Response.json({
    ok: true,
    queued,
    scanned: reminderRows.length,
  });
}
