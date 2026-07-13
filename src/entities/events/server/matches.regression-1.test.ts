import { describe, expect, it, vi } from "vitest";

import { isProfileMatchBookingEligible } from "./matches";

vi.mock("server-only", () => ({}));

// Regression: ISSUE-003 — future and cancelled bookings appeared in Matche
// Found by /qa on 2026-07-13
// Report: .gstack/qa-reports/qa-report-localhost-6670-2026-07-13.md
describe("profile match event eligibility", () => {
  const now = new Date("2026-07-13T00:00:00.000Z");

  it("keeps future bookings out of match results", () => {
    expect(
      isProfileMatchBookingEligible({
        bookingStatus: "confirmed",
        now,
        startsAt: new Date("2031-05-24T17:00:00.000Z"),
      }),
    ).toBe(false);
  });

  it("keeps cancelled bookings out even after the event date", () => {
    expect(
      isProfileMatchBookingEligible({
        bookingStatus: "cancelled",
        now,
        startsAt: new Date("2026-06-14T18:00:00.000Z"),
      }),
    ).toBe(false);
  });

  it("allows completed-time confirmed and attended bookings", () => {
    const startsAt = new Date("2026-06-14T18:00:00.000Z");

    expect(isProfileMatchBookingEligible({ bookingStatus: "confirmed", now, startsAt })).toBe(true);
    expect(isProfileMatchBookingEligible({ bookingStatus: "attended", now, startsAt })).toBe(true);
  });
});
