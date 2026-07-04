import type { NextRequest } from "next/server";
import { and, eq, gte, lt, sql } from "drizzle-orm";

import { resolveLocale, type Locale } from "@/shared/i18n/locales";
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

function formatEventDate(date: Date, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "pl-PL", {
    day: "numeric",
    month: "long",
    timeZone: "Europe/Warsaw",
  }).format(date);
}

function formatEventTime(date: Date, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "pl-PL", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    timeZone: "Europe/Warsaw",
  }).format(date);
}

function formatEventPrice(priceGroszy: number, currency: string) {
  return `${Math.round(priceGroszy / 100)} ${currency}`;
}

function formatEventSpots(spotsAvailable: number, locale: Locale) {
  if (locale === "en") {
    return spotsAvailable === 1 ? "1 seat" : `${spotsAvailable} seats`;
  }

  if (spotsAvailable === 1) {
    return "1 miejsce";
  }

  if (spotsAvailable > 1 && spotsAvailable < 5) {
    return `${spotsAvailable} miejsca`;
  }

  return `${spotsAvailable} miejsc`;
}

function getAppUrl(request: NextRequest) {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;

  if (
    process.env.NODE_ENV === "production" &&
    /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::|\/|$)/i.test(configuredUrl)
  ) {
    return "https://rounddate.pl";
  }

  return configuredUrl.replace(/\/$/, "");
}

function formatVenueAddress(input: {
  venueAddress: string | null;
  venueCity: string | null;
  venueDistrict: string | null;
}) {
  return [input.venueAddress, input.venueDistrict, input.venueCity].filter(Boolean).join(", ");
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
      attendeeNumber: bookings.attendeeNumber,
      ageMax: events.ageMax,
      ageMin: events.ageMin,
      currency: events.currency,
      eventId: events.id,
      eventImageSrc: events.imageSrc,
      eventTitle: events.title,
      locale: profiles.locale,
      priceGroszy: events.priceGroszy,
      spotsAvailable: events.spotsAvailable,
      startsAt: events.startsAt,
      to: authUsers.email,
      userId: authUsers.id,
      venueAddress: venues.address,
      venueCity: venues.city,
      venueDistrict: venues.district,
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
    const locale = resolveLocale(row.locale);

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
      ageRange: `${row.ageMin}-${row.ageMax}`,
      attendeeNumber: row.attendeeNumber ?? undefined,
      detailsUrl: `${getAppUrl(request)}/profile/bookings`,
      eventDate: formatEventDate(row.startsAt, locale),
      eventTime: formatEventTime(row.startsAt, locale),
      eventTitle: row.eventTitle,
      eventUrl: `${getAppUrl(request)}/profile/events`,
      imageSrc: row.eventImageSrc ?? undefined,
      locale,
      metadata: {
        bookingId: row.bookingId,
        eventId: row.eventId,
        startsAt: row.startsAt.toISOString(),
      },
      priceLabel: formatEventPrice(row.priceGroszy, row.currency),
      spotsLabel: formatEventSpots(row.spotsAvailable, locale),
      to: row.to,
      userId: row.userId,
      venueAddress: formatVenueAddress(row),
      venueName: row.venueName ?? "RoundDate",
    });
    queued += 1;
  }

  return Response.json({
    ok: true,
    queued,
    scanned: reminderRows.length,
  });
}
