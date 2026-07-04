import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  createBookingCheckoutSession: vi.fn(),
  createUserBooking: vi.fn(),
  getSession: vi.fn(),
  getUserBookings: vi.fn(),
}));

vi.mock("@/entities/events", () => ({
  createUserBooking: mocks.createUserBooking,
  getUserBookings: mocks.getUserBookings,
}));

vi.mock("@/shared/server/auth/auth", () => ({
  getAuth: () => ({
    api: {
      getSession: mocks.getSession,
    },
  }),
}));

vi.mock("@/shared/server/payments/stripe-checkout", () => ({
  createBookingCheckoutSession: mocks.createBookingCheckoutSession,
}));

import { POST } from "./route";

describe("profile bookings API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = "https://rounddate.example";
    process.env.STRIPE_API_KEY = "rk_test_checkout";
    delete process.env.STRIPE_SECRET_KEY;
    mocks.getSession.mockResolvedValue({
      user: {
        email: "guest@example.com",
        id: "user-1",
      },
    });
  });

  it("creates a Stripe Checkout Session for pending payment bookings", async () => {
    const booking = {
      bookingId: "booking-1",
      bookingStatus: "pending_payment",
      currency: "PLN",
      id: "event-1",
      paymentStatus: "pending",
      price: 129,
      status: "payment-pending",
      title: "RoundDate 25-35",
    };
    mocks.createUserBooking.mockResolvedValue({ booking, status: 201 });
    mocks.createBookingCheckoutSession.mockResolvedValue({
      id: "cs_test_1",
      url: "https://checkout.stripe.com/c/pay/cs_test_1",
    });

    const response = await POST(
      new Request("https://rounddate.example/api/profile/bookings", {
        body: JSON.stringify({ eventId: "event-1" }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );

    await expect(response.json()).resolves.toEqual({
      booking,
      checkout: {
        id: "cs_test_1",
        url: "https://checkout.stripe.com/c/pay/cs_test_1",
      },
    });
    expect(mocks.createBookingCheckoutSession).toHaveBeenCalledWith({
      appUrl: "https://rounddate.example",
      booking: {
        bookingId: "booking-1",
        currency: "PLN",
        eventId: "event-1",
        price: 129,
        title: "RoundDate 25-35",
      },
      customerEmail: "guest@example.com",
    });
  });

  it("does not create a booking when Stripe is not configured", async () => {
    delete process.env.STRIPE_API_KEY;
    delete process.env.STRIPE_SECRET_KEY;

    const response = await POST(
      new Request("https://rounddate.example/api/profile/bookings", {
        body: JSON.stringify({ eventId: "event-1" }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );

    await expect(response.json()).resolves.toEqual({
      error: "Stripe nie jest skonfigurowany.",
    });
    expect(response.status).toBe(503);
    expect(mocks.createUserBooking).not.toHaveBeenCalled();
  });

  it("localizes API errors from the request locale cookie", async () => {
    delete process.env.STRIPE_API_KEY;
    delete process.env.STRIPE_SECRET_KEY;

    const response = await POST(
      new Request("https://rounddate.example/api/profile/bookings", {
        body: JSON.stringify({ eventId: "event-1" }),
        headers: {
          "Content-Type": "application/json",
          Cookie: "rounddate-locale=en",
        },
        method: "POST",
      }),
    );

    await expect(response.json()).resolves.toEqual({
      error: "Stripe is not configured.",
    });
    expect(response.status).toBe(503);
  });

  it("does not create a Stripe Checkout Session for non-payable booking states", async () => {
    const booking = {
      bookingId: "booking-1",
      bookingStatus: "waitlisted",
      currency: "PLN",
      id: "event-1",
      paymentStatus: "pending",
      price: 129,
      status: "waitlist",
      title: "RoundDate 25-35",
    };
    mocks.createUserBooking.mockResolvedValue({ booking, status: 200 });

    const response = await POST(
      new Request("https://rounddate.example/api/profile/bookings", {
        body: JSON.stringify({ eventId: "event-1" }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );

    await expect(response.json()).resolves.toEqual({ booking });
    expect(mocks.createBookingCheckoutSession).not.toHaveBeenCalled();
  });
});
