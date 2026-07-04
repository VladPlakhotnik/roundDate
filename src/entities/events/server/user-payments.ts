import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { defaultLocale } from "@/shared/i18n/locales";
import { createTranslator } from "@/shared/i18n/translate";
import { getAuth } from "@/shared/server/auth/auth";
import { getDb } from "@/shared/server/db/client";
import { bookings, events, payments, venues } from "@/shared/server/db/schema";
import { getStripe } from "@/shared/server/payments/stripe";
import type { BookingStatus } from "@/shared/types";

import {
  buildStripeRefundOptions,
  buildStripeRefundParams,
  getBookingCancellationState,
  getPaymentMethodLabel,
} from "../model/user-payments";

export {
  BOOKING_CANCELLATION_DEADLINE_HOURS,
  buildStripeRefundOptions,
  buildStripeRefundParams,
  getBookingCancellationState,
  getPaymentMethodLabel,
} from "../model/user-payments";

type PaymentStatus = "failed" | "paid" | "pending" | "refunded";
type ServerTranslator = ReturnType<typeof createTranslator>;

type BookingCancellationPayment = {
  id: string;
  providerPaymentId: null | string;
  status: PaymentStatus;
};

type BookingForCancellation = {
  bookingId: string;
  bookingStatus: BookingStatus;
  payment: BookingCancellationPayment | null;
  startsAt: Date;
};

type StripeRefundInput = {
  bookingId: string;
  paymentId: string;
  paymentIntentId: string;
};

type SaveCancelledBookingInput = {
  bookingId: string;
  failedPaymentId: null | string;
  updatedAt: Date;
};

type SaveRefundedBookingInput = {
  bookingId: string;
  paymentId: string;
  refundedAt: Date;
  stripeRefundId: string;
};

export type CancelUserBookingDeps = {
  createRefund: (input: StripeRefundInput) => Promise<{ id: string }>;
  expireCheckoutSession: (sessionId: string) => Promise<void>;
  getBookingForCancellation: (input: {
    bookingId: string;
    userId: string;
  }) => Promise<BookingForCancellation | null>;
  getCurrentUserId: (headers: Headers) => Promise<null | string>;
  saveCancelledBooking: (input: SaveCancelledBookingInput) => Promise<void>;
  saveRefundedBooking: (input: SaveRefundedBookingInput) => Promise<void>;
};

export type CancelUserBookingResult =
  | {
      cancelled: true;
      refunded: boolean;
      status: 200;
    }
  | {
      deadlineAt?: string;
      error: string;
      status: 400 | 401 | 404 | 409 | 502;
    };

const blockedCancellationStatuses = new Set<BookingStatus>([
  "attended",
  "cancelled",
  "no_show",
  "refunded",
]);

function createDefaultCancelBookingDeps(): CancelUserBookingDeps {
  return {
    async createRefund(input) {
      const refund = await getStripe().refunds.create(
        buildStripeRefundParams(input),
        buildStripeRefundOptions(input),
      );

      return { id: refund.id };
    },
    async expireCheckoutSession(sessionId) {
      await getStripe().checkout.sessions.expire(sessionId);
    },
    async getBookingForCancellation({ bookingId, userId }) {
      const db = getDb();
      const [row] = await db
        .select({
          bookingId: bookings.id,
          bookingStatus: bookings.status,
          paymentId: payments.id,
          paymentProviderPaymentId: payments.providerPaymentId,
          paymentStatus: payments.status,
          startsAt: events.startsAt,
        })
        .from(bookings)
        .innerJoin(events, eq(bookings.eventId, events.id))
        .leftJoin(payments, eq(payments.bookingId, bookings.id))
        .where(and(eq(bookings.id, bookingId), eq(bookings.userId, userId)))
        .orderBy(desc(payments.createdAt))
        .limit(1);

      if (!row) {
        return null;
      }

      return {
        bookingId: row.bookingId,
        bookingStatus: row.bookingStatus,
        payment: row.paymentId
          ? {
              id: row.paymentId,
              providerPaymentId: row.paymentProviderPaymentId,
              status: row.paymentStatus ?? "pending",
            }
          : null,
        startsAt: row.startsAt,
      };
    },
    async getCurrentUserId(headers) {
      const session = await getAuth().api.getSession({ headers });

      return session?.user?.id ?? null;
    },
    async saveCancelledBooking({ bookingId, failedPaymentId, updatedAt }) {
      const db = getDb();

      await db
        .update(bookings)
        .set({
          status: "cancelled",
          updatedAt,
        })
        .where(eq(bookings.id, bookingId));

      if (failedPaymentId) {
        await db
          .update(payments)
          .set({
            status: "failed",
            updatedAt,
          })
          .where(eq(payments.id, failedPaymentId));
      }
    },
    async saveRefundedBooking({ bookingId, paymentId, refundedAt, stripeRefundId }) {
      const db = getDb();

      await db
        .update(bookings)
        .set({
          status: "refunded",
          updatedAt: refundedAt,
        })
        .where(eq(bookings.id, bookingId));

      await db
        .update(payments)
        .set({
          refundedAt,
          status: "refunded",
          stripeRefundId,
          updatedAt: refundedAt,
        })
        .where(eq(payments.id, paymentId));
    },
  };
}

export async function cancelUserBooking(
  input: {
    bookingId: string;
    headers: Headers;
    now?: Date;
    t?: ServerTranslator;
  },
  deps: CancelUserBookingDeps = createDefaultCancelBookingDeps(),
): Promise<CancelUserBookingResult> {
  const t = input.t ?? createTranslator(defaultLocale);
  const bookingId = input.bookingId.trim();

  if (!bookingId) {
    return { error: t("api.bookings.missingBookingId"), status: 400 };
  }

  const userId = await deps.getCurrentUserId(input.headers);

  if (!userId) {
    return { error: t("api.bookings.loginRequired"), status: 401 };
  }

  const booking = await deps.getBookingForCancellation({ bookingId, userId });

  if (!booking) {
    return { error: t("api.bookings.notFound"), status: 404 };
  }

  if (
    blockedCancellationStatuses.has(booking.bookingStatus) ||
    booking.payment?.status === "refunded"
  ) {
    return { error: t("api.bookings.alreadyLocked"), status: 409 };
  }

  const now = input.now ?? new Date();
  const cancellationState = getBookingCancellationState({
    now,
    startsAt: booking.startsAt,
  });

  if (!cancellationState.canCancel) {
    return {
      deadlineAt: cancellationState.deadlineAt.toISOString(),
      error: t("api.bookings.tooLate"),
      status: 409,
    };
  }

  if (booking.payment?.status === "paid") {
    if (!booking.payment.providerPaymentId?.startsWith("pi_")) {
      return {
        error: t("api.bookings.refundPaymentMissing"),
        status: 502,
      };
    }

    try {
      const refund = await deps.createRefund({
        bookingId: booking.bookingId,
        paymentId: booking.payment.id,
        paymentIntentId: booking.payment.providerPaymentId,
      });

      await deps.saveRefundedBooking({
        bookingId: booking.bookingId,
        paymentId: booking.payment.id,
        refundedAt: now,
        stripeRefundId: refund.id,
      });

      return {
        cancelled: true,
        refunded: true,
        status: 200,
      };
    } catch (error) {
      void error;

      return {
        error: t("api.bookings.refundFailed"),
        status: 502,
      };
    }
  }

  if (
    booking.payment?.status === "pending" &&
    booking.payment.providerPaymentId?.startsWith("cs_")
  ) {
    try {
      await deps.expireCheckoutSession(booking.payment.providerPaymentId);
    } catch (error) {
      void error;

      return {
        error: t("api.bookings.paymentProcessing"),
        status: 409,
      };
    }
  }

  await deps.saveCancelledBooking({
    bookingId: booking.bookingId,
    failedPaymentId: booking.payment?.status === "pending" ? booking.payment.id : null,
    updatedAt: now,
  });

  return {
    cancelled: true,
    refunded: false,
    status: 200,
  };
}

const paymentStatusLabels = {
  failed: "Płatność nieudana",
  paid: "Opłacono",
  pending: "Oczekuje na płatność",
  refunded: "Zwrot wykonany",
} satisfies Record<PaymentStatus, string>;

const paymentDateFormatter = new Intl.DateTimeFormat("pl-PL", {
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  month: "long",
  timeZone: "Europe/Warsaw",
  year: "numeric",
});

const eventDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  timeZone: "Europe/Warsaw",
});

function formatPaymentAmount(amountGroszy: number, currency: string) {
  return `${Math.round(amountGroszy / 100)} ${currency.toUpperCase()}`;
}

function formatPaymentDate(date: Date | null) {
  return date ? paymentDateFormatter.format(date) : null;
}

export type UserPaymentHistoryItem = {
  amountLabel: string;
  eventDateLabel: string;
  eventTitle: string;
  id: string;
  paidAtLabel: null | string;
  paymentMethodLabel: string;
  refundedAtLabel: null | string;
  status: PaymentStatus;
  statusLabel: string;
  venueName: string;
};

export async function getUserPaymentHistory(input: {
  headers: Headers;
}): Promise<UserPaymentHistoryItem[]> {
  const session = await getAuth().api.getSession({ headers: input.headers });

  if (!session?.user) {
    return [];
  }

  const rows = await getDb()
    .select({
      amountGroszy: payments.amountGroszy,
      currency: payments.currency,
      eventStartsAt: events.startsAt,
      eventTitle: events.title,
      id: payments.id,
      paidAt: payments.paidAt,
      paymentMethodType: payments.paymentMethodType,
      refundedAt: payments.refundedAt,
      status: payments.status,
      updatedAt: payments.updatedAt,
      venueName: venues.name,
    })
    .from(payments)
    .innerJoin(bookings, eq(payments.bookingId, bookings.id))
    .innerJoin(events, eq(bookings.eventId, events.id))
    .leftJoin(venues, eq(events.venueId, venues.id))
    .where(eq(bookings.userId, session.user.id))
    .orderBy(desc(payments.createdAt));

  return rows.map((row) => {
    const paidAt = row.paidAt ?? (row.status === "paid" ? row.updatedAt : null);

    return {
      amountLabel: formatPaymentAmount(row.amountGroszy, row.currency),
      eventDateLabel: eventDateFormatter.format(row.eventStartsAt),
      eventTitle: row.eventTitle,
      id: row.id,
      paidAtLabel: formatPaymentDate(paidAt),
      paymentMethodLabel: getPaymentMethodLabel(row.paymentMethodType),
      refundedAtLabel: formatPaymentDate(row.refundedAt),
      status: row.status,
      statusLabel: paymentStatusLabels[row.status],
      venueName: row.venueName ?? "Miejsce do potwierdzenia",
    };
  });
}
