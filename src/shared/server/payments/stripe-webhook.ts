import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import type Stripe from "stripe";

import { getDb } from "@/shared/server/db/client";
import { bookings, events, payments } from "@/shared/server/db/schema";
import { createSiteNotification } from "@/shared/server/notifications/site-notifications";

type CheckoutSessionLike = Pick<
  Stripe.Checkout.Session,
  | "client_reference_id"
  | "id"
  | "metadata"
  | "payment_intent"
  | "payment_method_types"
  | "payment_status"
>;

function getCheckoutSessionBookingId(session: CheckoutSessionLike) {
  return session.metadata?.bookingId ?? session.client_reference_id ?? null;
}

function getPaymentIntentId(session: CheckoutSessionLike) {
  if (!session.payment_intent) {
    return session.id;
  }

  if (typeof session.payment_intent === "string") {
    return session.payment_intent;
  }

  return session.payment_intent.id;
}

function getPaymentMethodType(session: CheckoutSessionLike) {
  return session.payment_method_types?.[0] ?? null;
}

async function createPaymentNotification(input: {
  bookingId: string;
  checkoutSessionId: string;
  status: "failed" | "paid";
  db: ReturnType<typeof getDb>;
}) {
  if (typeof (input.db as { select?: unknown }).select !== "function") {
    return;
  }

  const [row] = await input.db
    .select({
      eventTitle: events.title,
      userId: bookings.userId,
    })
    .from(bookings)
    .innerJoin(events, eq(bookings.eventId, events.id))
    .where(eq(bookings.id, input.bookingId))
    .limit(1);

  if (!row) {
    return;
  }

  await createSiteNotification({
    actionUrl: "/profile/bookings",
    body:
      input.status === "paid"
        ? "Platnosc zostala potwierdzona. Rezerwacja jest aktywna."
        : "Nie udalo sie potwierdzic platnosci. Mozesz sprobowac ponownie.",
    dedupeKey: `payment-${input.status}/${input.bookingId}/${input.checkoutSessionId}`,
    metadata: {
      bookingId: input.bookingId,
      checkoutSessionId: input.checkoutSessionId,
      eventTitle: row.eventTitle,
      paymentStatus: input.status,
    },
    title: input.status === "paid" ? "Platnosc potwierdzona" : "Platnosc nieudana",
    tone: input.status === "paid" ? "success" : "warning",
    type: input.status === "paid" ? "payment-paid" : "payment-failed",
    userId: row.userId,
  });
}

export async function markCheckoutSessionPaid(session: CheckoutSessionLike, db = getDb()) {
  if (session.payment_status && session.payment_status !== "paid") {
    return { ok: true, status: "ignored" as const };
  }

  const bookingId = getCheckoutSessionBookingId(session);

  if (!bookingId) {
    return { ok: false, status: "missing_booking_id" as const };
  }

  const now = new Date();

  await db
    .update(bookings)
    .set({
      status: "confirmed",
      updatedAt: now,
    })
    .where(
      and(
        eq(bookings.id, bookingId),
        eq(bookings.stripeCheckoutSessionId, session.id),
        inArray(bookings.status, ["pending_payment"]),
      ),
    );

  await db
    .update(payments)
    .set({
      paidAt: now,
      paymentMethodType: getPaymentMethodType(session),
      providerPaymentId: getPaymentIntentId(session),
      status: "paid",
      updatedAt: now,
    })
    .where(
      and(
        eq(payments.bookingId, bookingId),
        eq(payments.providerPaymentId, session.id),
        eq(payments.status, "pending"),
      ),
    );

  await createPaymentNotification({
    bookingId,
    checkoutSessionId: session.id,
    db,
    status: "paid",
  });

  return { ok: true, status: "processed" as const };
}

export async function markCheckoutSessionExpired(session: CheckoutSessionLike, db = getDb()) {
  return markCheckoutSessionPaymentFailed(session, db);
}

export async function markCheckoutSessionPaymentFailed(session: CheckoutSessionLike, db = getDb()) {
  const bookingId = getCheckoutSessionBookingId(session);

  if (!bookingId) {
    return { ok: false, status: "missing_booking_id" as const };
  }

  const now = new Date();

  await db
    .update(bookings)
    .set({
      status: "payment_failed",
      updatedAt: now,
    })
    .where(
      and(
        eq(bookings.id, bookingId),
        eq(bookings.stripeCheckoutSessionId, session.id),
        inArray(bookings.status, ["pending_payment"]),
      ),
    );

  await db
    .update(payments)
    .set({
      status: "failed",
      updatedAt: now,
    })
    .where(
      and(
        eq(payments.bookingId, bookingId),
        eq(payments.providerPaymentId, session.id),
        eq(payments.status, "pending"),
      ),
    );

  await createPaymentNotification({
    bookingId,
    checkoutSessionId: session.id,
    db,
    status: "failed",
  });

  return { ok: true, status: "processed" as const };
}
