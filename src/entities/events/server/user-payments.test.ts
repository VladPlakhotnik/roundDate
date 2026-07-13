import { describe, expect, it } from "vitest";

import {
  buildStripeRefundOptions,
  buildStripeRefundParams,
  getBookingCancellationState,
  getPaymentMethodLabel,
} from "../model/user-payments";

describe("user payment helpers", () => {
  it("allows cancelling at least 24 hours before event starts", () => {
    const startsAt = new Date("2031-05-24T17:00:00.000Z");

    expect(
      getBookingCancellationState({
        now: new Date("2031-05-23T16:59:59.000Z"),
        startsAt,
      }),
    ).toMatchObject({ canCancel: true });
    expect(
      getBookingCancellationState({
        now: new Date("2031-05-23T17:00:00.000Z"),
        startsAt,
      }),
    ).toMatchObject({ canCancel: true });
    expect(
      getBookingCancellationState({
        now: new Date("2031-05-23T17:00:01.000Z"),
        startsAt,
      }),
    ).toMatchObject({ canCancel: false });
  });

  it("builds a full Stripe refund request from a paid booking payment", () => {
    expect(
      buildStripeRefundParams({
        bookingId: "booking-1",
        paymentId: "payment-1",
        paymentIntentId: "pi_test_1",
      }),
    ).toEqual({
      metadata: {
        bookingId: "booking-1",
        paymentId: "payment-1",
      },
      payment_intent: "pi_test_1",
      reason: "requested_by_customer",
    });
  });

  it("builds a stable Stripe idempotency key for booking refunds", () => {
    expect(
      buildStripeRefundOptions({
        bookingId: "booking-1",
        paymentId: "payment-1",
      }),
    ).toEqual({
      idempotencyKey: "booking-refund:booking-1:payment-1",
    });
  });

  it("formats payment method names for profile payment history", () => {
    expect(getPaymentMethodLabel("card")).toBe("Karta");
    expect(getPaymentMethodLabel("blik")).toBe("BLIK");
    expect(getPaymentMethodLabel(null)).toBe("Stripe Checkout");
  });
});
