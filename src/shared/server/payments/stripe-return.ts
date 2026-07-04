import "server-only";

import { and, eq } from "drizzle-orm";

import { getAuth } from "@/shared/server/auth/auth";
import { getDb } from "@/shared/server/db/client";
import { bookings } from "@/shared/server/db/schema";

import { getStripe } from "./stripe";
import { markCheckoutSessionPaid } from "./stripe-webhook";

type SyncCheckoutSessionInput = {
  headers: Headers;
  sessionId: string;
};

function getCheckoutSessionBookingId(session: {
  client_reference_id?: null | string;
  metadata?: null | Record<string, string>;
}) {
  return session.metadata?.bookingId ?? session.client_reference_id ?? null;
}

export async function syncCheckoutSessionForCurrentUser({
  headers,
  sessionId,
}: SyncCheckoutSessionInput) {
  const session = await getAuth().api.getSession({ headers });

  if (!session?.user) {
    return { ok: false, status: "unauthorized" as const };
  }

  if (!sessionId.startsWith("cs_")) {
    return { ok: false, status: "invalid_session" as const };
  }

  const stripeSession = await getStripe().checkout.sessions.retrieve(sessionId);
  const bookingId = getCheckoutSessionBookingId(stripeSession);

  if (!bookingId) {
    return { ok: false, status: "missing_booking_id" as const };
  }

  const db = getDb();
  const [ownedBooking] = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.id, bookingId),
        eq(bookings.userId, session.user.id),
        eq(bookings.stripeCheckoutSessionId, stripeSession.id),
      ),
    )
    .limit(1);

  if (!ownedBooking) {
    return { ok: false, status: "not_found" as const };
  }

  if (stripeSession.payment_status !== "paid") {
    return { ok: true, status: "not_paid" as const };
  }

  return markCheckoutSessionPaid(stripeSession, db);
}
