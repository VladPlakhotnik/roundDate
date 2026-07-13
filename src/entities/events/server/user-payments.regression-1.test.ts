import { describe, expect, it, vi } from "vitest";

import { filterVisiblePaymentHistoryRows } from "./user-payments";

vi.mock("server-only", () => ({}));

// Regression: ISSUE-005 — abandoned checkout attempts cluttered payment history
// Found by /qa on 2026-07-13
// Report: .gstack/qa-reports/qa-report-localhost-6670-2026-07-13.md
describe("payment history visibility", () => {
  it("keeps only the newest pending attempt for an active unpaid booking", () => {
    const visibleRows = filterVisiblePaymentHistoryRows([
      {
        bookingId: "booking-active",
        bookingStatus: "pending_payment" as const,
        id: "pending-new",
        status: "pending" as const,
      },
      {
        bookingId: "booking-active",
        bookingStatus: "pending_payment" as const,
        id: "pending-old",
        status: "pending" as const,
      },
    ]);

    expect(visibleRows.map((row) => row.id)).toEqual(["pending-new"]);
  });

  it("hides stale pending attempts but preserves terminal transactions", () => {
    const visibleRows = filterVisiblePaymentHistoryRows([
      {
        bookingId: "booking-paid",
        bookingStatus: "confirmed" as const,
        id: "paid",
        status: "paid" as const,
      },
      {
        bookingId: "booking-paid",
        bookingStatus: "confirmed" as const,
        id: "abandoned",
        status: "pending" as const,
      },
      {
        bookingId: "booking-refunded",
        bookingStatus: "refunded" as const,
        id: "refunded",
        status: "refunded" as const,
      },
    ]);

    expect(visibleRows.map((row) => row.id)).toEqual(["paid", "refunded"]);
  });
});
