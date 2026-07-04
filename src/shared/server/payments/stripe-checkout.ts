import "server-only";

import { eq } from "drizzle-orm";
import type Stripe from "stripe";

import { getDb } from "@/shared/server/db/client";
import { bookings, payments } from "@/shared/server/db/schema";

import { getStripe } from "./stripe";

type BookingCheckoutInput = {
  bookingId: string;
  currency: string;
  eventId: string;
  price: number;
  title: string;
};

type BuildCheckoutSessionParamsInput = {
  appUrl: string;
  booking: BookingCheckoutInput;
  customerEmail?: string | null | undefined;
};

type CreateBookingCheckoutSessionInput = BuildCheckoutSessionParamsInput & {
  db?: ReturnType<typeof getDb>;
  stripe?: Pick<Stripe, "checkout">;
};

function normalizeAppUrl(appUrl: string) {
  return appUrl.replace(/\/+$/, "");
}

export function buildBookingCheckoutSessionParams({
  appUrl,
  booking,
  customerEmail,
}: BuildCheckoutSessionParamsInput): Stripe.Checkout.SessionCreateParams {
  const normalizedAppUrl = normalizeAppUrl(appUrl);
  const metadata = {
    bookingId: booking.bookingId,
    eventId: booking.eventId,
  };

  return {
    allow_promotion_codes: true,
    client_reference_id: booking.bookingId,
    ...(customerEmail ? { customer_email: customerEmail } : {}),
    line_items: [
      {
        price_data: {
          currency: booking.currency.toLowerCase(),
          product_data: {
            name: booking.title,
            metadata,
          },
          unit_amount: Math.round(booking.price * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    payment_intent_data: {
      metadata,
    },
    success_url: `${normalizedAppUrl}/profile/bookings?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${normalizedAppUrl}/profile/bookings?payment=cancelled&booking_id=${booking.bookingId}`,
    metadata,
  };
}

export async function createBookingCheckoutSession({
  appUrl,
  booking,
  customerEmail,
  db = getDb(),
  stripe = getStripe(),
}: CreateBookingCheckoutSessionInput) {
  const params = buildBookingCheckoutSessionParams({ appUrl, booking, customerEmail });
  const session = await stripe.checkout.sessions.create(params);

  if (!session.url) {
    throw new Error("Stripe Checkout did not return a redirect URL.");
  }

  await db
    .update(bookings)
    .set({
      status: "pending_payment",
      stripeCheckoutSessionId: session.id,
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, booking.bookingId));

  await db.insert(payments).values({
    amountGroszy: Math.round(booking.price * 100),
    bookingId: booking.bookingId,
    currency: booking.currency.toUpperCase(),
    provider: "stripe",
    providerPaymentId: session.id,
    status: "pending",
  });

  return {
    id: session.id,
    url: session.url,
  };
}
