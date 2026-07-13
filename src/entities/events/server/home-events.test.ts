import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/shared/server/db/client", () => ({
  getDb: vi.fn(() => {
    throw new Error("Database unavailable");
  }),
}));

import {
  getBookingBadgeStatus,
  getEffectiveEventStatus,
  getEventBookingBlockReason,
  getEvents,
  isRestartableBookingStatus,
  selectLatestBookingPaymentRows,
} from "./home-events";

describe("home events server data", () => {
  it("can disable seed fallback for production landing data", async () => {
    const events = await getEvents({
      limit: 3,
      statuses: ["published"],
      useFallback: false,
    } as Parameters<typeof getEvents>[0] & { useFallback: false });

    expect(events).toEqual([]);
  });

  it("keeps only the latest payment attempt for each booking", () => {
    const rows = [
      { bookingId: "booking-1", paymentId: "latest-payment" },
      { bookingId: "booking-1", paymentId: "older-payment" },
      { bookingId: "booking-2", paymentId: "only-payment" },
    ];

    expect(selectLatestBookingPaymentRows(rows)).toEqual([rows[0], rows[2]]);
  });

  it("restarts only cancelled or refunded bookings before a new payment", () => {
    expect(isRestartableBookingStatus("cancelled")).toBe(true);
    expect(isRestartableBookingStatus("refunded")).toBe(true);
    expect(isRestartableBookingStatus("confirmed")).toBe(false);
    expect(isRestartableBookingStatus("pending_payment")).toBe(false);
  });

  it("derives a finished event status from its start time", () => {
    const now = new Date("2026-07-13T10:00:00.000Z");
    const startsAt = new Date("2026-06-14T18:00:00.000Z");

    expect(getEffectiveEventStatus("published", startsAt, now)).toBe("finished");
    expect(getEffectiveEventStatus("sold_out", startsAt, now)).toBe("finished");
    expect(getEffectiveEventStatus("cancelled", startsAt, now)).toBe("cancelled");
  });

  it("shows ended instead of confirmed or pending for a past booking", () => {
    const shared = {
      eventStatus: "finished" as const,
      now: new Date("2026-07-13T10:00:00.000Z"),
      startsAt: "2026-06-14T18:00:00.000Z",
    };

    expect(getBookingBadgeStatus({ ...shared, status: "confirmed" })).toBe("event-ended");
    expect(getBookingBadgeStatus({ ...shared, status: "pending_payment" })).toBe("event-ended");
    expect(getBookingBadgeStatus({ ...shared, status: "cancelled" })).toBe("cancelled");
  });

  it("returns only future published fallback events with available places", async () => {
    const events = await getEvents({ statuses: ["published"] });

    expect(events.length).toBeGreaterThan(0);
    expect(
      events.every(
        (event) =>
          event.status === "published" &&
          event.spotsAvailable > 0 &&
          new Date(event.startsAt).getTime() > Date.now(),
      ),
    ).toBe(true);
  });

  it.each([
    {
      expected: "past",
      hasExistingBooking: false,
      spotsAvailable: 5,
      startsAt: new Date("2031-05-24T16:59:59.000Z"),
      status: "published" as const,
    },
    {
      expected: "unavailable",
      hasExistingBooking: false,
      spotsAvailable: 5,
      startsAt: new Date("2031-05-24T18:00:00.000Z"),
      status: "draft" as const,
    },
    {
      expected: "sold-out",
      hasExistingBooking: false,
      spotsAvailable: 0,
      startsAt: new Date("2031-05-24T18:00:00.000Z"),
      status: "published" as const,
    },
    {
      expected: null,
      hasExistingBooking: true,
      spotsAvailable: 0,
      startsAt: new Date("2031-05-24T18:00:00.000Z"),
      status: "sold_out" as const,
    },
  ])("returns $expected for a booking eligibility state", (input) => {
    expect(
      getEventBookingBlockReason({
        ...input,
        now: new Date("2031-05-24T17:00:00.000Z"),
      }),
    ).toBe(input.expected);
  });
});
