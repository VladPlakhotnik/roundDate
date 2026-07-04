export const BOOKING_CANCELLATION_DEADLINE_HOURS = 12;

type BookingCancellationInput = {
  now?: Date;
  startsAt: Date;
};

type StripeRefundInput = {
  bookingId: string;
  paymentId: string;
  paymentIntentId: string;
};

type StripeRefundOptionsInput = Pick<StripeRefundInput, "bookingId" | "paymentId">;

const paymentMethodLabels: Record<string, string> = {
  blik: "BLIK",
  card: "Karta",
  klarna: "Klarna",
  p24: "Przelewy24",
  paypal: "PayPal",
};

export function getBookingCancellationState({
  now = new Date(),
  startsAt,
}: BookingCancellationInput) {
  const deadlineAt = new Date(
    startsAt.getTime() - BOOKING_CANCELLATION_DEADLINE_HOURS * 60 * 60 * 1000,
  );

  return {
    canCancel: now.getTime() <= deadlineAt.getTime(),
    deadlineAt,
  };
}

export function buildStripeRefundParams({
  bookingId,
  paymentId,
  paymentIntentId,
}: StripeRefundInput) {
  return {
    metadata: {
      bookingId,
      paymentId,
    },
    payment_intent: paymentIntentId,
    reason: "requested_by_customer" as const,
  };
}

export function buildStripeRefundOptions({ bookingId, paymentId }: StripeRefundOptionsInput) {
  return {
    idempotencyKey: `booking-refund:${bookingId}:${paymentId}`,
  };
}

export function getPaymentMethodLabel(method: null | string) {
  if (!method) {
    return "Stripe Checkout";
  }

  return paymentMethodLabels[method] ?? method;
}
