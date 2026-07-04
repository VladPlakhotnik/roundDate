import { NextResponse } from "next/server";

import { createUserBooking, getUserBookings } from "@/entities/events";
import { getRequestTranslatorFromRequest } from "@/shared/i18n/server";
import { getAuth } from "@/shared/server/auth/auth";
import { createBookingCheckoutSession } from "@/shared/server/payments/stripe-checkout";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function parseScope(value: string | null) {
  if (value === "past" || value === "upcoming") {
    return value;
  }

  return "all";
}

function hasStripeApiKey() {
  return Boolean(process.env.STRIPE_API_KEY || process.env.STRIPE_SECRET_KEY);
}

export async function GET(request: Request) {
  const t = getRequestTranslatorFromRequest(request);
  const session = await getAuth().api.getSession({ headers: request.headers });

  if (!session?.user) {
    return jsonError(t("api.bookings.loginRequired"), 401);
  }

  const url = new URL(request.url);
  const bookings = await getUserBookings({
    headers: request.headers,
    scope: parseScope(url.searchParams.get("scope")),
  });

  return NextResponse.json({ bookings });
}

export async function POST(request: Request) {
  const t = getRequestTranslatorFromRequest(request);
  const session = await getAuth().api.getSession({ headers: request.headers });

  if (!session?.user) {
    return jsonError(t("api.bookings.loginRequired"), 401);
  }

  const body = await readJson(request);
  const eventId = typeof body?.eventId === "string" ? body.eventId.trim() : "";

  if (!eventId) {
    return jsonError(t("api.bookings.missingEventId"), 400);
  }

  if (!hasStripeApiKey()) {
    return jsonError(t("api.bookings.stripeNotConfigured"), 503);
  }

  const result = await createUserBooking({
    eventId,
    headers: request.headers,
    t,
  });

  if (!result.booking) {
    return jsonError(result.error ?? t("api.bookings.createError"), result.status);
  }

  const needsPayment =
    result.booking.bookingStatus === "pending_payment" ||
    result.booking.bookingStatus === "payment_failed" ||
    result.booking.status === "payment-pending";

  if (!needsPayment) {
    return NextResponse.json({ booking: result.booking }, { status: result.status });
  }

  try {
    const checkout = await createBookingCheckoutSession({
      appUrl: process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin,
      booking: {
        bookingId: result.booking.bookingId,
        currency: result.booking.currency,
        eventId: result.booking.id,
        price: result.booking.price,
        title: result.booking.title,
      },
      customerEmail: session.user.email ?? null,
    });

    return NextResponse.json({ booking: result.booking, checkout }, { status: result.status });
  } catch {
    return jsonError(t("api.bookings.stripeCreateError"), 502);
  }
}
