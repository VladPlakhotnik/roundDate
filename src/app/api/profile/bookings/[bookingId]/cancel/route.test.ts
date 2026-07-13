import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const cancelUserBookingMock = vi.hoisted(() => vi.fn());

vi.mock("@/entities/events/server/user-payments", () => ({
  cancelUserBooking: cancelUserBookingMock,
}));

import { POST } from "./route";

describe("profile booking cancel API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the cancellation result from the booking service", async () => {
    cancelUserBookingMock.mockResolvedValue({
      cancelled: true,
      refunded: true,
      status: 200,
    });

    const response = await POST(
      new Request("https://rounddate.example/api/profile/bookings/booking-1/cancel", {
        method: "POST",
      }),
      {
        params: Promise.resolve({ bookingId: "booking-1" }),
      },
    );

    await expect(response.json()).resolves.toEqual({
      cancelled: true,
      refunded: true,
    });
    expect(response.status).toBe(200);
    expect(cancelUserBookingMock).toHaveBeenCalledWith({
      bookingId: "booking-1",
      headers: expect.any(Headers),
      t: expect.any(Function),
    });
  });

  it("returns a service error with its original status", async () => {
    cancelUserBookingMock.mockResolvedValue({
      error: "Udział można anulować najpóźniej 24 godziny przed rozpoczęciem wydarzenia.",
      status: 409,
    });

    const response = await POST(
      new Request("https://rounddate.example/api/profile/bookings/booking-1/cancel", {
        method: "POST",
      }),
      {
        params: Promise.resolve({ bookingId: "booking-1" }),
      },
    );

    await expect(response.json()).resolves.toEqual({
      error: "Udział można anulować najpóźniej 24 godziny przed rozpoczęciem wydarzenia.",
    });
    expect(response.status).toBe(409);
  });

  it("passes a request-localized translator to the booking service", async () => {
    cancelUserBookingMock.mockResolvedValue({
      cancelled: true,
      refunded: false,
      status: 200,
    });

    await POST(
      new Request("https://rounddate.example/api/profile/bookings/booking-1/cancel", {
        headers: { Cookie: "rounddate-locale=en" },
        method: "POST",
      }),
      {
        params: Promise.resolve({ bookingId: "booking-1" }),
      },
    );

    const input = cancelUserBookingMock.mock.calls[0]?.[0];

    expect(input.t("api.bookings.tooLate")).toBe(
      "You can cancel participation no later than 24 hours before the event starts.",
    );
  });
});
