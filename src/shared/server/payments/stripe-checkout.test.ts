import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { buildBookingCheckoutSessionParams } from "./stripe-checkout";

describe("Stripe booking checkout", () => {
  it("builds a hosted Checkout Session for a booking payment", () => {
    expect(
      buildBookingCheckoutSessionParams({
        appUrl: "https://rounddate.example",
        booking: {
          bookingId: "booking-1",
          currency: "PLN",
          eventId: "event-1",
          price: 129,
          title: "RoundDate 25-35",
        },
        customerEmail: "guest@example.com",
      }),
    ).toEqual(
      expect.objectContaining({
        allow_promotion_codes: true,
        client_reference_id: "booking-1",
        customer_email: "guest@example.com",
        mode: "payment",
        payment_intent_data: {
          metadata: {
            bookingId: "booking-1",
            eventId: "event-1",
          },
        },
        success_url:
          "https://rounddate.example/profile/bookings?payment=success&session_id={CHECKOUT_SESSION_ID}",
        cancel_url:
          "https://rounddate.example/profile/bookings?payment=cancelled&booking_id=booking-1",
      }),
    );
  });

  it("uses inline price data from the event instead of requiring dashboard products", () => {
    const params = buildBookingCheckoutSessionParams({
      appUrl: "https://rounddate.example/",
      booking: {
        bookingId: "booking-2",
        currency: "pln",
        eventId: "event-2",
        price: 109,
        title: "RoundDate intro",
      },
      customerEmail: null,
    });

    expect(params.customer_email).toBeUndefined();
    expect(params.line_items).toEqual([
      {
        price_data: {
          currency: "pln",
          product_data: {
            name: "RoundDate intro",
            metadata: {
              bookingId: "booking-2",
              eventId: "event-2",
            },
          },
          unit_amount: 10900,
        },
        quantity: 1,
      },
    ]);
  });
});
