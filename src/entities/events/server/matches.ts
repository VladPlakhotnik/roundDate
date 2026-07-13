import "server-only";

import { revalidatePath } from "next/cache";
import { and, asc, desc, eq, ilike, inArray, or, type SQL } from "drizzle-orm";

import { requireAdmin } from "@/admin/auth/require-admin";
import { recordAdminAuditLog } from "@/admin/server/audit-logs";
import { getAuth } from "@/shared/server/auth/auth";
import { getDb } from "@/shared/server/db/client";
import {
  authUsers,
  bookings,
  eventLikes,
  events,
  profiles,
  venues,
} from "@/shared/server/db/schema";
import { sendEventResultNotification } from "@/shared/server/email/notifications";
import type { BookingStatus, EventStatus } from "@/shared/types";

export type EventLikePair = {
  fromBookingId: string;
  toBookingId: string;
};

export type AdminMatchParticipant = {
  attendeeNumber: number | null;
  bookingId: string;
  email: string;
  eventId: string;
  gender: string | null;
  likesGivenToNumbers: number[];
  name: string;
  phone: string | null;
  status: BookingStatus;
};

export type AdminMatchEventMetrics = {
  attendedCount: number;
  confirmedCount: number;
  femaleParticipants: number;
  likesCount: number;
  maleParticipants: number;
  mutualMatchesCount: number;
  noShowCount: number;
  totalParticipants: number;
  waitlistedCount: number;
};

export type AdminMatchEvent = {
  attendedCount: number;
  capacityTotal: number;
  confirmedCount: number;
  femaleCapacity: number;
  femaleParticipants: number;
  id: string;
  likesCount: number;
  maleCapacity: number;
  maleParticipants: number;
  mutualMatchesCount: number;
  noShowCount: number;
  participants: AdminMatchParticipant[];
  matchResultsPublishedAt: string | null;
  startsAt: Date;
  status: EventStatus;
  title: string;
  totalParticipants: number;
  venueName: string | null;
  waitlistedCount: number;
};

export type AdminMatchStatusFilter = EventStatus | "all";

export type AdminMatchFilters = {
  q: string;
  status: AdminMatchStatusFilter;
};

export type AdminMatchesPageData = {
  filters: AdminMatchFilters;
  events: AdminMatchEvent[];
};

export type ProfileMatchPerson = {
  age: number | null;
  attendeeNumber: number | null;
  avatarSrc: string;
  city: string;
  id: string;
  name: string;
  phone: string | null;
  phoneHref: string | null;
};

export type ProfileMatchEvent =
  | {
      dateLabel: string;
      eventImageSrc: string;
      id: string;
      location: string;
      matches: ProfileMatchPerson[];
      state: "matches";
      timeLabel: string;
      title: string;
    }
  | {
      dateLabel: string;
      eventImageSrc: string;
      id: string;
      location: string;
      state: "empty";
      timeLabel: string;
      title: string;
    }
  | {
      dateLabel: string;
      eventImageSrc: string;
      id: string;
      location: string;
      state: "pending";
      timeLabel: string;
      title: string;
      unlocksAt: string;
    };

const eventDateFormatter = new Intl.DateTimeFormat("pl-PL", {
  day: "numeric",
  month: "long",
  timeZone: "Europe/Warsaw",
  year: "numeric",
});

const eventTimeFormatter = new Intl.DateTimeFormat("pl-PL", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Warsaw",
  weekday: "short",
});
const defaultMatchResultsPublicUrl = "https://rounddate.pl";

const adminEditableBookingStatuses = [
  "pending",
  "pending_payment",
  "confirmed",
  "waitlisted",
  "cancelled",
  "attended",
  "no_show",
  "payment_failed",
  "refunded",
] satisfies BookingStatus[];

const adminMatchStatusFilters = new Set<AdminMatchStatusFilter>([
  "all",
  "cancelled",
  "draft",
  "finished",
  "published",
  "sold_out",
]);

function getSingleParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function normalizeSearchQuery(value: string) {
  const query = value.trim().slice(0, 120);

  return query.length >= 2 ? query : "";
}

export function normalizeAdminMatchFilters(
  params: Record<string, string | string[] | undefined>,
): AdminMatchFilters {
  const status = getSingleParam(params.status);

  return {
    q: normalizeSearchQuery(getSingleParam(params.q)),
    status: adminMatchStatusFilters.has(status as AdminMatchStatusFilter)
      ? (status as AdminMatchStatusFilter)
      : "all",
  };
}

export function getNextAttendeeNumber(attendeeNumbers: Array<number | null | undefined>) {
  const maxNumber = attendeeNumbers.reduce<number>(
    (max, value) => (typeof value === "number" && value > max ? value : max),
    0,
  );

  return maxNumber + 1;
}

export function parseAttendeeNumberList(value: string) {
  const numbers = value
    .split(/[^\d]+/)
    .map((part) => Number(part))
    .filter((number) => Number.isInteger(number) && number > 0);

  return [...new Set(numbers)];
}

export function getMutualMatchBookingIds(bookingId: string, likes: EventLikePair[]) {
  const likedByUser = new Set(
    likes.filter((like) => like.fromBookingId === bookingId).map((like) => like.toBookingId),
  );
  const likedUser = new Set(
    likes.filter((like) => like.toBookingId === bookingId).map((like) => like.fromBookingId),
  );

  return [...likedByUser].filter((otherBookingId) => likedUser.has(otherBookingId)).sort();
}

function readMatchResultsPublishedAt(metadata: Record<string, unknown> | null | undefined) {
  const value = metadata?.matchResultsPublishedAt;

  if (typeof value !== "string") {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function getProfileMatchResultState(input: {
  eventStatus: EventStatus;
  metadata?: Record<string, unknown> | null;
  now?: Date;
  startsAt: Date;
}) {
  if (input.startsAt > (input.now ?? new Date())) {
    return {
      state: "pending" as const,
      unlocksAt: "po zakończeniu wydarzenia",
    };
  }

  if (readMatchResultsPublishedAt(input.metadata)) {
    return { state: "results" as const };
  }

  return {
    state: "pending" as const,
    unlocksAt: "po publikacji wyników",
  };
}

const profileMatchBookingStatuses = new Set<BookingStatus>(["attended", "confirmed"]);

export function isProfileMatchBookingEligible(input: {
  bookingStatus: BookingStatus;
  now?: Date;
  startsAt: Date;
}) {
  return (
    profileMatchBookingStatuses.has(input.bookingStatus) &&
    input.startsAt <= (input.now ?? new Date())
  );
}

export function getMatchResultCounts(input: { bookingIds: string[]; likes: EventLikePair[] }) {
  return new Map(
    input.bookingIds.map((bookingId) => [
      bookingId,
      getMutualMatchBookingIds(bookingId, input.likes).length,
    ]),
  );
}

export function hasAdminMatchFormEdits(formData: FormData) {
  for (const key of formData.keys()) {
    if (key.startsWith("likes:") || key.startsWith("status:")) {
      return true;
    }
  }

  return false;
}

function isLocalUrl(value: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::|\/|$)/i.test(value);
}

function getMatchResultsUrl() {
  const configuredUrl = process.env.EMAIL_PUBLIC_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  const publicUrl =
    configuredUrl && !isLocalUrl(configuredUrl) ? configuredUrl : defaultMatchResultsPublicUrl;

  return `${publicUrl.replace(/\/$/, "")}/profile/matches`;
}

export function normalizeAdminBookingStatus(
  value: FormDataEntryValue | string | null | undefined,
  fallback: BookingStatus,
) {
  if (typeof value !== "string") {
    return fallback;
  }

  return adminEditableBookingStatuses.includes(value as BookingStatus)
    ? (value as BookingStatus)
    : fallback;
}

function getGenderBucket(gender: string | null) {
  const normalizedGender = gender?.trim().toLowerCase();

  if (!normalizedGender) {
    return null;
  }

  if (
    [
      "female",
      "woman",
      "women",
      "kobieta",
      "dziewczyna",
      "\u0436\u0435\u043d\u0449\u0438\u043d\u0430",
      "\u0434\u0435\u0432\u0443\u0448\u043a\u0430",
    ].includes(normalizedGender)
  ) {
    return "female";
  }

  if (
    [
      "male",
      "man",
      "men",
      "mężczyzna",
      "mezczyzna",
      "\u043f\u0430\u0440\u0435\u043d\u044c",
      "\u043c\u0443\u0436\u0447\u0438\u043d\u0430",
    ].includes(normalizedGender)
  ) {
    return "male";
  }

  return null;
}

function getMutualMatchCount(likes: EventLikePair[]) {
  const directedPairs = new Set(likes.map((like) => `${like.fromBookingId}:${like.toBookingId}`));
  const mutualPairs = new Set<string>();

  for (const like of likes) {
    if (!directedPairs.has(`${like.toBookingId}:${like.fromBookingId}`)) {
      continue;
    }

    mutualPairs.add([like.fromBookingId, like.toBookingId].sort().join(":"));
  }

  return mutualPairs.size;
}

function createAdminMatchesWhere(filters: AdminMatchFilters): SQL | undefined {
  const clauses: SQL[] = [];

  if (filters.q) {
    const like = `%${filters.q}%`;
    const searchClause = or(
      ilike(events.title, like),
      ilike(events.slug, like),
      ilike(events.city, like),
      ilike(venues.name, like),
      ilike(venues.address, like),
    );

    if (searchClause) {
      clauses.push(searchClause);
    }
  }

  if (filters.status !== "all") {
    clauses.push(eq(events.status, filters.status));
  }

  return clauses.length > 0 ? and(...clauses) : undefined;
}

export function getAdminMatchEventMetrics(input: {
  likes: EventLikePair[];
  participants: Array<{
    gender: string | null;
    likesGivenToNumbers: number[];
    status: BookingStatus;
  }>;
}): AdminMatchEventMetrics {
  return input.participants.reduce<AdminMatchEventMetrics>(
    (metrics, participant) => {
      const genderBucket = getGenderBucket(participant.gender);

      return {
        attendedCount: metrics.attendedCount + (participant.status === "attended" ? 1 : 0),
        confirmedCount: metrics.confirmedCount + (participant.status === "confirmed" ? 1 : 0),
        femaleParticipants: metrics.femaleParticipants + (genderBucket === "female" ? 1 : 0),
        likesCount: metrics.likesCount + participant.likesGivenToNumbers.length,
        maleParticipants: metrics.maleParticipants + (genderBucket === "male" ? 1 : 0),
        mutualMatchesCount: metrics.mutualMatchesCount,
        noShowCount: metrics.noShowCount + (participant.status === "no_show" ? 1 : 0),
        totalParticipants: metrics.totalParticipants + 1,
        waitlistedCount: metrics.waitlistedCount + (participant.status === "waitlisted" ? 1 : 0),
      };
    },
    {
      attendedCount: 0,
      confirmedCount: 0,
      femaleParticipants: 0,
      likesCount: 0,
      maleParticipants: 0,
      mutualMatchesCount: getMutualMatchCount(input.likes),
      noShowCount: 0,
      totalParticipants: 0,
      waitlistedCount: 0,
    },
  );
}

function getDisplayName(input: {
  email: string;
  firstName: string | null;
  lastName: string | null;
  name: string;
}) {
  return [input.firstName, input.lastName].filter(Boolean).join(" ") || input.name || input.email;
}

function getAge(birthDate: string | Date | null) {
  if (!birthDate) {
    return null;
  }

  const date = new Date(birthDate);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const monthDelta = now.getMonth() - date.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < date.getDate())) {
    age -= 1;
  }

  return age;
}

function getPhoneHref(phone: string | null) {
  const normalized = phone?.replace(/[^\d+]/g, "");

  return normalized ? `tel:${normalized}` : null;
}

export async function getAdminMatchesPageData(
  filters: AdminMatchFilters = { q: "", status: "all" },
): Promise<AdminMatchesPageData> {
  await requireAdmin();
  const db = getDb();
  const where = createAdminMatchesWhere(filters);
  const eventQuery = db
    .select({
      capacityTotal: events.capacityTotal,
      femaleCapacity: events.femaleCapacity,
      id: events.id,
      maleCapacity: events.maleCapacity,
      metadata: events.metadata,
      startsAt: events.startsAt,
      status: events.status,
      title: events.title,
      venueName: venues.name,
    })
    .from(events)
    .leftJoin(venues, eq(events.venueId, venues.id));
  const eventRows = await (where ? eventQuery.where(where) : eventQuery).orderBy(
    desc(events.startsAt),
  );

  if (eventRows.length === 0) {
    return { events: [], filters };
  }

  const eventIds = eventRows.map((event) => event.id);
  const [participantRows, likeRows] = await Promise.all([
    db
      .select({
        attendeeNumber: bookings.attendeeNumber,
        bookingId: bookings.id,
        email: authUsers.email,
        eventId: bookings.eventId,
        firstName: profiles.firstName,
        gender: profiles.gender,
        lastName: profiles.lastName,
        name: authUsers.name,
        phone: profiles.phone,
        status: bookings.status,
      })
      .from(bookings)
      .innerJoin(authUsers, eq(bookings.userId, authUsers.id))
      .leftJoin(profiles, eq(profiles.userId, authUsers.id))
      .where(inArray(bookings.eventId, eventIds))
      .orderBy(asc(bookings.eventId), asc(bookings.attendeeNumber), asc(authUsers.name)),
    db
      .select({
        eventId: eventLikes.eventId,
        fromBookingId: eventLikes.fromBookingId,
        toBookingId: eventLikes.toBookingId,
      })
      .from(eventLikes)
      .where(inArray(eventLikes.eventId, eventIds)),
  ]);
  const numberByBookingId = new Map(
    participantRows.map((participant) => [participant.bookingId, participant.attendeeNumber]),
  );
  const likesByEventId = new Map<string, EventLikePair[]>();

  for (const like of likeRows) {
    const eventLikesForEvent = likesByEventId.get(like.eventId) ?? [];

    eventLikesForEvent.push({
      fromBookingId: like.fromBookingId,
      toBookingId: like.toBookingId,
    });
    likesByEventId.set(like.eventId, eventLikesForEvent);
  }

  const participantsByEventId = new Map<string, AdminMatchParticipant[]>();

  for (const participant of participantRows) {
    const participantData: AdminMatchParticipant = {
      attendeeNumber: participant.attendeeNumber,
      bookingId: participant.bookingId,
      email: participant.email,
      eventId: participant.eventId,
      gender: participant.gender,
      likesGivenToNumbers: likeRows
        .filter(
          (like) =>
            like.eventId === participant.eventId && like.fromBookingId === participant.bookingId,
        )
        .map((like) => numberByBookingId.get(like.toBookingId))
        .filter((number): number is number => typeof number === "number")
        .sort((first, second) => first - second),
      name: getDisplayName(participant),
      phone: participant.phone,
      status: participant.status,
    };
    const eventParticipants = participantsByEventId.get(participant.eventId) ?? [];

    eventParticipants.push(participantData);
    participantsByEventId.set(participant.eventId, eventParticipants);
  }

  return {
    filters,
    events: eventRows.map(({ metadata, ...event }) => {
      const participants = participantsByEventId.get(event.id) ?? [];
      const likes = likesByEventId.get(event.id) ?? [];
      const metrics = getAdminMatchEventMetrics({ likes, participants });

      return {
        ...event,
        ...metrics,
        matchResultsPublishedAt: readMatchResultsPublishedAt(metadata),
        participants,
      };
    }),
  };
}

export async function saveAdminEventMatchesAction(formData: FormData) {
  "use server";

  const admin = await requireAdmin();
  const eventId = String(formData.get("eventId") ?? "");

  if (!eventId) {
    return;
  }

  if (hasAdminMatchFormEdits(formData)) {
    await saveAdminEventMatchesAction(formData);
  }

  const db = getDb();
  const participantRows = await db
    .select({
      attendeeNumber: bookings.attendeeNumber,
      bookingId: bookings.id,
      status: bookings.status,
    })
    .from(bookings)
    .where(eq(bookings.eventId, eventId));
  const bookingIdByNumber = new Map(
    participantRows
      .filter((participant) => typeof participant.attendeeNumber === "number")
      .map((participant) => [participant.attendeeNumber as number, participant.bookingId]),
  );
  const validBookingIds = new Set(participantRows.map((participant) => participant.bookingId));
  const values: Array<typeof eventLikes.$inferInsert> = [];
  const updatedAt = new Date();
  const statusUpdates = participantRows.flatMap((participant) => {
    const status = normalizeAdminBookingStatus(
      formData.get(`status:${participant.bookingId}`),
      participant.status,
    );

    if (status === participant.status) {
      return [];
    }

    return db
      .update(bookings)
      .set({ status, updatedAt })
      .where(and(eq(bookings.id, participant.bookingId), eq(bookings.eventId, eventId)));
  });

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("likes:") || typeof value !== "string") {
      continue;
    }

    const fromBookingId = key.slice("likes:".length);

    if (!validBookingIds.has(fromBookingId)) {
      continue;
    }

    for (const attendeeNumber of parseAttendeeNumberList(value)) {
      const toBookingId = bookingIdByNumber.get(attendeeNumber);

      if (!toBookingId || toBookingId === fromBookingId) {
        continue;
      }

      values.push({
        createdByAdminId: admin.id,
        eventId,
        fromBookingId,
        toBookingId,
      });
    }
  }

  await Promise.all(statusUpdates);
  await db.delete(eventLikes).where(eq(eventLikes.eventId, eventId));

  if (values.length > 0) {
    await db.insert(eventLikes).values(values).onConflictDoNothing();
  }

  await recordAdminAuditLog({
    action: "matches.updated",
    actor: admin,
    entityId: eventId,
    entityType: "event",
    metadata: {
      likesCount: values.length,
      statusUpdatesCount: statusUpdates.length,
    },
    summary: `\u041e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u044b \u043f\u043e\u0441\u0435\u0449\u0435\u043d\u0438\u0435 \u0438 \u0441\u0438\u043c\u043f\u0430\u0442\u0438\u0438 \u043c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u044f: ${eventId}`,
  });

  revalidatePath("/admin/matches");
  revalidatePath("/profile/matches");
}

export async function publishAdminEventMatchesAction(formData: FormData) {
  "use server";

  const admin = await requireAdmin();
  const eventId = String(formData.get("eventId") ?? "");

  if (!eventId) {
    return;
  }

  const db = getDb();
  const [event] = await db
    .select({
      metadata: events.metadata,
      title: events.title,
    })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event || readMatchResultsPublishedAt(event.metadata)) {
    return;
  }

  const [participantRows, likeRows] = await Promise.all([
    db
      .select({
        bookingId: bookings.id,
        email: authUsers.email,
        locale: profiles.locale,
        userId: authUsers.id,
      })
      .from(bookings)
      .innerJoin(authUsers, eq(bookings.userId, authUsers.id))
      .leftJoin(profiles, eq(profiles.userId, authUsers.id))
      .where(eq(bookings.eventId, eventId)),
    db
      .select({
        fromBookingId: eventLikes.fromBookingId,
        toBookingId: eventLikes.toBookingId,
      })
      .from(eventLikes)
      .where(eq(eventLikes.eventId, eventId)),
  ]);
  const publishedAt = new Date();
  const publishedAtIso = publishedAt.toISOString();
  const matchCounts = getMatchResultCounts({
    bookingIds: participantRows.map((participant) => participant.bookingId),
    likes: likeRows,
  });

  await db
    .update(events)
    .set({
      metadata: {
        ...(event.metadata ?? {}),
        matchResultsPublishedAt: publishedAtIso,
        matchResultsPublishedByAdminId: admin.id,
      },
      updatedAt: publishedAt,
    })
    .where(eq(events.id, eventId));

  const resultsUrl = getMatchResultsUrl();
  const notificationResults = await Promise.allSettled(
    participantRows.map((participant) => {
      const matchCount = matchCounts.get(participant.bookingId) ?? 0;

      return sendEventResultNotification({
        eventTitle: event.title,
        locale: participant.locale,
        matchCount,
        metadata: {
          bookingId: participant.bookingId,
          eventId,
          matchCount,
        },
        resultsUrl,
        to: participant.email,
        userId: participant.userId,
      });
    }),
  );
  const notificationsFailed = notificationResults.filter(
    (result) => result.status === "rejected",
  ).length;

  await recordAdminAuditLog({
    action: "matches.published",
    actor: admin,
    entityId: eventId,
    entityType: "event",
    metadata: {
      eventId,
      notificationsFailed,
      notificationsSent: notificationResults.length - notificationsFailed,
      participantsCount: participantRows.length,
      publishedAt: publishedAtIso,
    },
    summary: `\u041e\u043f\u0443\u0431\u043b\u0438\u043a\u043e\u0432\u0430\u043d\u044b \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442\u044b \u043c\u044d\u0442\u0447\u0435\u0439 \u043c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u044f: ${eventId}`,
  });

  revalidatePath("/admin/matches");
  revalidatePath("/profile/matches");
}

export async function saveAdminEventLikesAction(formData: FormData) {
  "use server";

  return saveAdminEventMatchesAction(formData);
}

export async function getUserMatchEvents(input: {
  headers: Headers;
}): Promise<ProfileMatchEvent[]> {
  const session = await getAuth().api.getSession({ headers: input.headers });

  if (!session?.user) {
    return [];
  }

  try {
    const db = getDb();
    const userBookingRows = await db
      .select({
        bookingId: bookings.id,
        bookingStatus: bookings.status,
        eventId: bookings.eventId,
        eventImageSrc: events.imageSrc,
        eventMetadata: events.metadata,
        eventStatus: events.status,
        startsAt: events.startsAt,
        title: events.title,
        venueAddress: venues.address,
        venueCity: events.city,
        venueName: venues.name,
      })
      .from(bookings)
      .innerJoin(events, eq(bookings.eventId, events.id))
      .leftJoin(venues, eq(events.venueId, venues.id))
      .where(eq(bookings.userId, session.user.id))
      .orderBy(desc(events.startsAt));
    const eligibleBookingRows = userBookingRows.filter((booking) =>
      isProfileMatchBookingEligible({
        bookingStatus: booking.bookingStatus,
        startsAt: new Date(booking.startsAt),
      }),
    );
    const eventIds = [...new Set(eligibleBookingRows.map((booking) => booking.eventId))];

    if (eventIds.length === 0) {
      return [];
    }

    const [likeRows, participantRows] = await Promise.all([
      db
        .select({
          eventId: eventLikes.eventId,
          fromBookingId: eventLikes.fromBookingId,
          toBookingId: eventLikes.toBookingId,
        })
        .from(eventLikes)
        .where(inArray(eventLikes.eventId, eventIds)),
      db
        .select({
          attendeeNumber: bookings.attendeeNumber,
          bookingId: bookings.id,
          birthDate: profiles.birthDate,
          email: authUsers.email,
          eventId: bookings.eventId,
          firstName: profiles.firstName,
          image: authUsers.image,
          lastName: profiles.lastName,
          name: authUsers.name,
          phone: profiles.phone,
        })
        .from(bookings)
        .innerJoin(authUsers, eq(bookings.userId, authUsers.id))
        .leftJoin(profiles, eq(profiles.userId, authUsers.id))
        .where(inArray(bookings.eventId, eventIds)),
    ]);
    const participantsByBookingId = new Map(
      participantRows.map((participant) => [participant.bookingId, participant]),
    );

    return eligibleBookingRows.map((booking) => {
      const startsAt = new Date(booking.startsAt);
      const resultState = getProfileMatchResultState({
        eventStatus: booking.eventStatus,
        metadata: booking.eventMetadata,
        startsAt,
      });
      const eventLikesForBooking = likeRows.filter((like) => like.eventId === booking.eventId);
      const mutualBookingIds = getMutualMatchBookingIds(booking.bookingId, eventLikesForBooking);
      const common = {
        dateLabel: eventDateFormatter.format(startsAt),
        eventImageSrc: booking.eventImageSrc ?? "/assets/atmosphere/conversation-03.png",
        id: booking.eventId,
        location: [booking.venueCity, booking.venueName ?? booking.venueAddress]
          .filter(Boolean)
          .join(", "),
        timeLabel: eventTimeFormatter.format(startsAt),
        title: booking.title,
      };

      if (resultState.state === "pending") {
        return {
          ...common,
          state: "pending",
          unlocksAt: resultState.unlocksAt,
        };
      }

      const matches = mutualBookingIds
        .map((bookingId) => participantsByBookingId.get(bookingId))
        .filter(Boolean)
        .map((participant) => ({
          age: getAge(participant!.birthDate),
          attendeeNumber: participant!.attendeeNumber,
          avatarSrc: participant!.image ?? "/assets/profile/matches/avatar-maria.png",
          city: booking.venueCity,
          id: participant!.bookingId,
          name: getDisplayName(participant!),
          phone: participant!.phone,
          phoneHref: getPhoneHref(participant!.phone),
        }));

      if (matches.length === 0) {
        return {
          ...common,
          state: "empty",
        };
      }

      return {
        ...common,
        matches,
        state: "matches",
      };
    });
  } catch {
    return [];
  }
}
