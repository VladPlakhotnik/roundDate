import "server-only";

import { revalidatePath } from "next/cache";
import { and, count, desc, eq, ilike, inArray, or, type SQL } from "drizzle-orm";

import { requireAdmin } from "@/admin/auth/require-admin";
import { recordAdminAuditLog } from "@/admin/server/audit-logs";
import { getDb } from "@/shared/server/db/client";
import {
  authSessions,
  authUsers,
  bookings,
  eventLikes,
  events,
  payments,
  profiles,
  venues,
} from "@/shared/server/db/schema";
import type { AppRole, BookingStatus, EventStatus } from "@/shared/types";

export type AdminUserRoleFilter = AppRole | "all";
export type AdminUserStatusFilter = "active" | "all" | "banned";

export type AdminUserFilters = {
  q: string;
  role: AdminUserRoleFilter;
  status: AdminUserStatusFilter;
};

export type AdminUserListItem = {
  banExpires: Date | null;
  banReason: string | null;
  banned: boolean;
  createdAt: Date;
  email: string;
  firstName: string | null;
  gender: string | null;
  id: string;
  image: string | null;
  lastName: string | null;
  name: string;
  phone: string | null;
  role: AppRole;
  updatedAt: Date;
};

export type AdminUsersPageData = {
  currentAdminId: string;
  filters: AdminUserFilters;
  total: number;
  users: AdminUserListItem[];
};

export type AdminUserPaymentStatus = "failed" | "paid" | "pending" | "refunded";

export type AdminUserActivityStats = {
  attendedCount: number;
  bookingsTotal: number;
  cancelledCount: number;
  failedPayments: number;
  likesGivenCount: number;
  likesReceivedCount: number;
  mutualMatchesCount: number;
  noShowCount: number;
  paidAmountGroszy: number;
  paidPayments: number;
  paymentsTotal: number;
  refundedPayments: number;
  upcomingCount: number;
  waitlistedCount: number;
};

export type AdminUserDetailsBooking = {
  attendeeNumber: number | null;
  bookingCreatedAt: Date;
  bookingId: string;
  city: string;
  eventId: string;
  eventSlug: string;
  eventStatus: EventStatus;
  eventTitle: string;
  startsAt: Date;
  status: BookingStatus;
  venueAddress: string | null;
  venueName: string | null;
};

export type AdminUserDetailsPayment = {
  amountGroszy: number;
  bookingId: string;
  createdAt: Date;
  currency: string;
  eventId: string;
  eventTitle: string;
  id: string;
  provider: string;
  providerPaymentId: string | null;
  status: AdminUserPaymentStatus;
};

export type AdminUserDetails = {
  banExpires: Date | null;
  banReason: string | null;
  banned: boolean;
  birthDate: string | null;
  createdAt: Date;
  discoverySource: string | null;
  email: string;
  emailNotifications: boolean | null;
  emailVerified: boolean;
  eventCriteriaNotifications: boolean | null;
  eventReminderNotifications: boolean | null;
  eventResultNotifications: boolean | null;
  firstName: string | null;
  gender: string | null;
  id: string;
  image: string | null;
  interestedIn: string | null;
  lastName: string | null;
  locale: string | null;
  marketingConsent: boolean | null;
  name: string;
  newDateNotifications: boolean | null;
  onboardingCompletedAt: Date | null;
  onboardingSkippedAt: Date | null;
  onboardingStartedAt: Date | null;
  phone: string | null;
  preferredDays: string[] | null;
  preferredTimes: string[] | null;
  role: AppRole;
  updatedAt: Date;
};

export type AdminUserDetailsPageData = {
  bookings: AdminUserDetailsBooking[];
  payments: AdminUserDetailsPayment[];
  stats: AdminUserActivityStats;
  user: AdminUserDetails;
};

const roleFilters = new Set<AdminUserRoleFilter>(["all", "admin", "manager", "user"]);
const statusFilters = new Set<AdminUserStatusFilter>(["active", "all", "banned"]);

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

export function normalizeAdminUserFilters(
  params: Record<string, string | string[] | undefined>,
): AdminUserFilters {
  const role = getSingleParam(params.role);
  const status = getSingleParam(params.status);

  return {
    q: normalizeSearchQuery(getSingleParam(params.q)),
    role: roleFilters.has(role as AdminUserRoleFilter) ? (role as AdminUserRoleFilter) : "all",
    status: statusFilters.has(status as AdminUserStatusFilter)
      ? (status as AdminUserStatusFilter)
      : "all",
  };
}

function createUsersWhere(filters: AdminUserFilters): SQL | undefined {
  const clauses: SQL[] = [];

  if (filters.q) {
    const like = `%${filters.q}%`;
    const searchClause = or(
      ilike(authUsers.name, like),
      ilike(authUsers.email, like),
      ilike(profiles.firstName, like),
      ilike(profiles.lastName, like),
      ilike(profiles.phone, like),
    );

    if (searchClause) {
      clauses.push(searchClause);
    }
  }

  if (filters.role !== "all") {
    clauses.push(eq(authUsers.role, filters.role));
  }

  if (filters.status === "active") {
    clauses.push(eq(authUsers.banned, false));
  }

  if (filters.status === "banned") {
    clauses.push(eq(authUsers.banned, true));
  }

  return clauses.length > 0 ? and(...clauses) : undefined;
}

export function getAdminUserActivityStats(input: {
  bookings: Array<{
    eventStatus: EventStatus;
    startsAt: Date;
    status: BookingStatus;
  }>;
  currentDate: Date;
  likesGivenCount: number;
  likesReceivedCount: number;
  mutualMatchesCount: number;
  payments: Array<{
    amountGroszy: number;
    status: AdminUserPaymentStatus;
  }>;
}): AdminUserActivityStats {
  return {
    attendedCount: input.bookings.filter((booking) => booking.status === "attended").length,
    bookingsTotal: input.bookings.length,
    cancelledCount: input.bookings.filter((booking) => booking.status === "cancelled").length,
    failedPayments: input.payments.filter((payment) => payment.status === "failed").length,
    likesGivenCount: input.likesGivenCount,
    likesReceivedCount: input.likesReceivedCount,
    mutualMatchesCount: input.mutualMatchesCount,
    noShowCount: input.bookings.filter((booking) => booking.status === "no_show").length,
    paidAmountGroszy: input.payments
      .filter((payment) => payment.status === "paid")
      .reduce((sum, payment) => sum + payment.amountGroszy, 0),
    paidPayments: input.payments.filter((payment) => payment.status === "paid").length,
    paymentsTotal: input.payments.length,
    refundedPayments: input.payments.filter((payment) => payment.status === "refunded").length,
    upcomingCount: input.bookings.filter(
      (booking) =>
        booking.startsAt > input.currentDate &&
        booking.status !== "cancelled" &&
        booking.eventStatus !== "cancelled",
    ).length,
    waitlistedCount: input.bookings.filter((booking) => booking.status === "waitlisted").length,
  };
}

function getMutualMatchesCount(input: {
  likes: Array<{ fromBookingId: string; toBookingId: string }>;
  userBookingIds: Set<string>;
}) {
  const directedLikes = new Set(
    input.likes.map((like) => `${like.fromBookingId}:${like.toBookingId}`),
  );
  const mutualLikes = new Set<string>();

  for (const like of input.likes) {
    if (
      input.userBookingIds.has(like.fromBookingId) &&
      directedLikes.has(`${like.toBookingId}:${like.fromBookingId}`)
    ) {
      mutualLikes.add(`${like.fromBookingId}:${like.toBookingId}`);
    }
  }

  return mutualLikes.size;
}

export async function getAdminUsersPageData(
  filters: AdminUserFilters,
): Promise<AdminUsersPageData> {
  const admin = await requireAdmin();
  const db = getDb();
  const where = createUsersWhere(filters);

  const usersQuery = db
    .select({
      banExpires: authUsers.banExpires,
      banReason: authUsers.banReason,
      banned: authUsers.banned,
      createdAt: authUsers.createdAt,
      email: authUsers.email,
      firstName: profiles.firstName,
      gender: profiles.gender,
      id: authUsers.id,
      image: authUsers.image,
      lastName: profiles.lastName,
      name: authUsers.name,
      phone: profiles.phone,
      role: authUsers.role,
      updatedAt: authUsers.updatedAt,
    })
    .from(authUsers)
    .leftJoin(profiles, eq(profiles.userId, authUsers.id));

  const totalQuery = db
    .select({ value: count() })
    .from(authUsers)
    .leftJoin(profiles, eq(profiles.userId, authUsers.id));

  const [users, totalRows] = await Promise.all([
    (where ? usersQuery.where(where) : usersQuery).orderBy(desc(authUsers.createdAt)),
    where ? totalQuery.where(where) : totalQuery,
  ]);

  return {
    currentAdminId: admin.id,
    filters,
    total: Number(totalRows[0]?.value ?? 0),
    users,
  };
}

export async function getAdminUserDetailsPageData(
  userId: string,
): Promise<AdminUserDetailsPageData | null> {
  await requireAdmin();
  const db = getDb();
  const [user] = await db
    .select({
      banExpires: authUsers.banExpires,
      banReason: authUsers.banReason,
      banned: authUsers.banned,
      birthDate: profiles.birthDate,
      createdAt: authUsers.createdAt,
      discoverySource: profiles.discoverySource,
      email: authUsers.email,
      emailNotifications: profiles.emailNotifications,
      emailVerified: authUsers.emailVerified,
      eventCriteriaNotifications: profiles.eventCriteriaNotifications,
      eventReminderNotifications: profiles.eventReminderNotifications,
      eventResultNotifications: profiles.eventResultNotifications,
      firstName: profiles.firstName,
      gender: profiles.gender,
      id: authUsers.id,
      image: authUsers.image,
      interestedIn: profiles.interestedIn,
      lastName: profiles.lastName,
      locale: profiles.locale,
      marketingConsent: profiles.marketingConsent,
      name: authUsers.name,
      newDateNotifications: profiles.newDateNotifications,
      onboardingCompletedAt: profiles.onboardingCompletedAt,
      onboardingSkippedAt: profiles.onboardingSkippedAt,
      onboardingStartedAt: profiles.onboardingStartedAt,
      phone: profiles.phone,
      preferredDays: profiles.preferredDays,
      preferredTimes: profiles.preferredTimes,
      role: authUsers.role,
      updatedAt: authUsers.updatedAt,
    })
    .from(authUsers)
    .leftJoin(profiles, eq(profiles.userId, authUsers.id))
    .where(eq(authUsers.id, userId))
    .limit(1);

  if (!user) {
    return null;
  }

  const [bookingRows, paymentRows] = await Promise.all([
    db
      .select({
        attendeeNumber: bookings.attendeeNumber,
        bookingCreatedAt: bookings.createdAt,
        bookingId: bookings.id,
        city: events.city,
        eventId: events.id,
        eventSlug: events.slug,
        eventStatus: events.status,
        eventTitle: events.title,
        startsAt: events.startsAt,
        status: bookings.status,
        venueAddress: venues.address,
        venueName: venues.name,
      })
      .from(bookings)
      .innerJoin(events, eq(bookings.eventId, events.id))
      .leftJoin(venues, eq(events.venueId, venues.id))
      .where(eq(bookings.userId, userId))
      .orderBy(desc(events.startsAt)),
    db
      .select({
        amountGroszy: payments.amountGroszy,
        bookingId: payments.bookingId,
        createdAt: payments.createdAt,
        currency: payments.currency,
        eventId: events.id,
        eventTitle: events.title,
        id: payments.id,
        provider: payments.provider,
        providerPaymentId: payments.providerPaymentId,
        status: payments.status,
      })
      .from(payments)
      .innerJoin(bookings, eq(payments.bookingId, bookings.id))
      .innerJoin(events, eq(bookings.eventId, events.id))
      .where(eq(bookings.userId, userId))
      .orderBy(desc(payments.createdAt)),
  ]);
  const userBookingIds = new Set(bookingRows.map((booking) => booking.bookingId));
  const likeRows =
    userBookingIds.size > 0
      ? await db
          .select({
            fromBookingId: eventLikes.fromBookingId,
            toBookingId: eventLikes.toBookingId,
          })
          .from(eventLikes)
          .where(
            or(
              inArray(eventLikes.fromBookingId, [...userBookingIds]),
              inArray(eventLikes.toBookingId, [...userBookingIds]),
            ),
          )
      : [];
  const likesGivenCount = likeRows.filter((like) => userBookingIds.has(like.fromBookingId)).length;
  const likesReceivedCount = likeRows.filter((like) => userBookingIds.has(like.toBookingId)).length;

  return {
    bookings: bookingRows,
    payments: paymentRows,
    stats: getAdminUserActivityStats({
      bookings: bookingRows,
      currentDate: new Date(),
      likesGivenCount,
      likesReceivedCount,
      mutualMatchesCount: getMutualMatchesCount({ likes: likeRows, userBookingIds }),
      payments: paymentRows,
    }),
    user,
  };
}

export async function banAdminUserAction(formData: FormData) {
  "use server";

  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");

  if (!userId || userId === admin.id) {
    revalidatePath("/admin/users");
    return;
  }

  const db = getDb();

  await db
    .update(authUsers)
    .set({
      banExpires: null,
      banReason: "Заблокирован администратором",
      banned: true,
      updatedAt: new Date(),
    })
    .where(eq(authUsers.id, userId));

  await db.delete(authSessions).where(eq(authSessions.userId, userId));

  await recordAdminAuditLog({
    action: "user.banned",
    actor: admin,
    entityId: userId,
    entityType: "user",
    summary: `Заблокирован пользователь: ${userId}`,
  });

  revalidatePath("/admin/users");
}

export async function unbanAdminUserAction(formData: FormData) {
  "use server";

  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");

  if (!userId) {
    revalidatePath("/admin/users");
    return;
  }

  await getDb()
    .update(authUsers)
    .set({
      banExpires: null,
      banReason: null,
      banned: false,
      updatedAt: new Date(),
    })
    .where(eq(authUsers.id, userId));

  await recordAdminAuditLog({
    action: "user.unbanned",
    actor: admin,
    entityId: userId,
    entityType: "user",
    summary: `Разблокирован пользователь: ${userId}`,
  });

  revalidatePath("/admin/users");
}
