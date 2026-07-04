import { describe, expect, it, vi } from "vitest";

import { getAdminUserActivityStats } from "./users";

vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/admin/auth/require-admin", () => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/shared/server/db/client", () => ({
  getDb: vi.fn(),
}));

describe("admin user details helpers", () => {
  it("summarizes bookings, payments and match activity", () => {
    expect(
      getAdminUserActivityStats({
        bookings: [
          {
            eventStatus: "finished",
            startsAt: new Date("2026-06-20T18:00:00.000Z"),
            status: "attended",
          },
          {
            eventStatus: "published",
            startsAt: new Date("2026-07-20T18:00:00.000Z"),
            status: "confirmed",
          },
          {
            eventStatus: "published",
            startsAt: new Date("2026-07-21T18:00:00.000Z"),
            status: "waitlisted",
          },
          {
            eventStatus: "cancelled",
            startsAt: new Date("2026-07-22T18:00:00.000Z"),
            status: "cancelled",
          },
        ],
        currentDate: new Date("2026-06-30T12:00:00.000Z"),
        likesGivenCount: 5,
        likesReceivedCount: 4,
        mutualMatchesCount: 2,
        payments: [
          { amountGroszy: 12900, status: "paid" },
          { amountGroszy: 9900, status: "failed" },
          { amountGroszy: 7900, status: "refunded" },
        ],
      }),
    ).toEqual({
      attendedCount: 1,
      bookingsTotal: 4,
      cancelledCount: 1,
      failedPayments: 1,
      likesGivenCount: 5,
      likesReceivedCount: 4,
      mutualMatchesCount: 2,
      noShowCount: 0,
      paidAmountGroszy: 12900,
      paidPayments: 1,
      paymentsTotal: 3,
      refundedPayments: 1,
      upcomingCount: 2,
      waitlistedCount: 1,
    });
  });
});
