import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { cancelUserBooking, type CancelUserBookingDeps } from "./user-payments";

function createDeps(overrides: Partial<CancelUserBookingDeps> = {}): CancelUserBookingDeps {
  return {
    createRefund: vi.fn(),
    expireCheckoutSession: vi.fn(),
    getBookingForCancellation: vi.fn(),
    getCurrentUserId: vi.fn().mockResolvedValue("user-1"),
    saveCancelledBooking: vi.fn(),
    saveRefundedBooking: vi.fn(),
    ...overrides,
  };
}

describe("cancelUserBooking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated cancellations", async () => {
    const deps = createDeps({
      getCurrentUserId: vi.fn().mockResolvedValue(null),
    });

    await expect(
      cancelUserBooking(
        {
          bookingId: "booking-1",
          headers: new Headers(),
        },
        deps,
      ),
    ).resolves.toEqual({
      error: "Zaloguj się na konto.",
      status: 401,
    });

    expect(deps.getBookingForCancellation).not.toHaveBeenCalled();
  });

  it("blocks cancellations after the 24 hour deadline", async () => {
    const deps = createDeps({
      getBookingForCancellation: vi.fn().mockResolvedValue({
        bookingId: "booking-1",
        bookingStatus: "confirmed",
        payment: {
          id: "payment-1",
          providerPaymentId: "pi_test_1",
          status: "paid",
        },
        startsAt: new Date("2031-05-24T17:00:00.000Z"),
      }),
    });

    const result = await cancelUserBooking(
      {
        bookingId: "booking-1",
        headers: new Headers(),
        now: new Date("2031-05-23T17:00:01.000Z"),
      },
      deps,
    );

    expect(result).toMatchObject({
      error: "Udział można anulować najpóźniej 24 godziny przed rozpoczęciem wydarzenia.",
      status: 409,
    });
    expect(deps.createRefund).not.toHaveBeenCalled();
    expect(deps.saveRefundedBooking).not.toHaveBeenCalled();
  });

  it("refunds a paid booking and marks it refunded", async () => {
    const deps = createDeps({
      createRefund: vi.fn().mockResolvedValue({ id: "re_test_1" }),
      getBookingForCancellation: vi.fn().mockResolvedValue({
        bookingId: "booking-1",
        bookingStatus: "confirmed",
        payment: {
          id: "payment-1",
          providerPaymentId: "pi_test_1",
          status: "paid",
        },
        startsAt: new Date("2031-05-24T17:00:00.000Z"),
      }),
    });

    const result = await cancelUserBooking(
      {
        bookingId: "booking-1",
        headers: new Headers(),
        now: new Date("2031-05-23T17:00:00.000Z"),
      },
      deps,
    );

    expect(result).toEqual({
      cancelled: true,
      refunded: true,
      status: 200,
    });
    expect(deps.createRefund).toHaveBeenCalledWith({
      bookingId: "booking-1",
      paymentId: "payment-1",
      paymentIntentId: "pi_test_1",
    });
    expect(deps.saveRefundedBooking).toHaveBeenCalledWith({
      bookingId: "booking-1",
      paymentId: "payment-1",
      refundedAt: new Date("2031-05-23T17:00:00.000Z"),
      stripeRefundId: "re_test_1",
    });
  });

  it("expires an unpaid Checkout Session before cancelling a pending booking", async () => {
    const deps = createDeps({
      getBookingForCancellation: vi.fn().mockResolvedValue({
        bookingId: "booking-1",
        bookingStatus: "pending_payment",
        payment: {
          id: "payment-1",
          providerPaymentId: "cs_test_1",
          status: "pending",
        },
        startsAt: new Date("2031-05-24T17:00:00.000Z"),
      }),
    });

    const result = await cancelUserBooking(
      {
        bookingId: "booking-1",
        headers: new Headers(),
        now: new Date("2031-05-23T17:00:00.000Z"),
      },
      deps,
    );

    expect(result).toEqual({
      cancelled: true,
      refunded: false,
      status: 200,
    });
    expect(deps.createRefund).not.toHaveBeenCalled();
    expect(deps.expireCheckoutSession).toHaveBeenCalledWith("cs_test_1");
    expect(deps.saveCancelledBooking).toHaveBeenCalledWith({
      bookingId: "booking-1",
      failedPaymentId: "payment-1",
      updatedAt: new Date("2031-05-23T17:00:00.000Z"),
    });
  });

  it("returns a generic error when Stripe refund fails", async () => {
    const deps = createDeps({
      createRefund: vi.fn().mockRejectedValue(new Error("Stripe secret diagnostic")),
      getBookingForCancellation: vi.fn().mockResolvedValue({
        bookingId: "booking-1",
        bookingStatus: "confirmed",
        payment: {
          id: "payment-1",
          providerPaymentId: "pi_test_1",
          status: "paid",
        },
        startsAt: new Date("2031-05-24T17:00:00.000Z"),
      }),
    });

    await expect(
      cancelUserBooking(
        {
          bookingId: "booking-1",
          headers: new Headers(),
          now: new Date("2031-05-23T17:00:00.000Z"),
        },
        deps,
      ),
    ).resolves.toEqual({
      error: "Nie udało się wykonać zwrotu przez Stripe. Spróbuj ponownie.",
      status: 502,
    });
  });
});
