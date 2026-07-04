import { describe, expect, it, vi } from "vitest";

import {
  getAdminMatchEventMetrics,
  getMatchResultCounts,
  getProfileMatchResultState,
  hasAdminMatchFormEdits,
  getMutualMatchBookingIds,
  getNextAttendeeNumber,
  normalizeAdminMatchFilters,
  normalizeAdminBookingStatus,
  parseAttendeeNumberList,
} from "./matches";

vi.mock("server-only", () => ({}));

describe("event matches helpers", () => {
  it("assigns the next attendee number per event", () => {
    expect(getNextAttendeeNumber([])).toBe(1);
    expect(getNextAttendeeNumber([1, 2, null, 4])).toBe(5);
  });

  it("parses admin-entered badge numbers without duplicates", () => {
    expect(parseAttendeeNumberList("2, 4 4; 7\nbad")).toEqual([2, 4, 7]);
  });

  it("returns only mutual liked booking ids", () => {
    expect(
      getMutualMatchBookingIds("booking-a", [
        { fromBookingId: "booking-a", toBookingId: "booking-b" },
        { fromBookingId: "booking-b", toBookingId: "booking-a" },
        { fromBookingId: "booking-a", toBookingId: "booking-c" },
      ]),
    ).toEqual(["booking-b"]);
  });

  it("keeps profile match results pending until admin publishes them", () => {
    const now = new Date("2026-07-02T12:00:00.000Z");

    expect(
      getProfileMatchResultState({
        eventStatus: "finished",
        metadata: null,
        now,
        startsAt: new Date("2026-07-01T18:00:00.000Z"),
      }),
    ).toEqual({
      state: "pending",
      unlocksAt: "po publikacji wynikow",
    });

    expect(
      getProfileMatchResultState({
        eventStatus: "finished",
        metadata: { matchResultsPublishedAt: "2026-07-02T10:00:00.000Z" },
        now,
        startsAt: new Date("2026-07-01T18:00:00.000Z"),
      }),
    ).toEqual({ state: "results" });
  });

  it("counts mutual matches for every result recipient including zero-match users", () => {
    expect(
      getMatchResultCounts({
        bookingIds: ["booking-a", "booking-b", "booking-c"],
        likes: [
          { fromBookingId: "booking-a", toBookingId: "booking-b" },
          { fromBookingId: "booking-b", toBookingId: "booking-a" },
          { fromBookingId: "booking-c", toBookingId: "booking-a" },
        ],
      }),
    ).toEqual(
      new Map([
        ["booking-a", 1],
        ["booking-b", 1],
        ["booking-c", 0],
      ]),
    );
  });

  it("summarizes event match metrics for the admin events table", () => {
    expect(
      getAdminMatchEventMetrics({
        likes: [
          { fromBookingId: "booking-a", toBookingId: "booking-b" },
          { fromBookingId: "booking-b", toBookingId: "booking-a" },
          { fromBookingId: "booking-c", toBookingId: "booking-a" },
        ],
        participants: [
          { gender: "female", likesGivenToNumbers: [2, 3], status: "attended" },
          { gender: "male", likesGivenToNumbers: [], status: "no_show" },
          { gender: "kobieta", likesGivenToNumbers: [1], status: "confirmed" },
          { gender: null, likesGivenToNumbers: [1], status: "waitlisted" },
        ],
      }),
    ).toEqual({
      attendedCount: 1,
      confirmedCount: 1,
      femaleParticipants: 2,
      likesCount: 4,
      maleParticipants: 1,
      mutualMatchesCount: 1,
      noShowCount: 1,
      totalParticipants: 4,
      waitlistedCount: 1,
    });
  });

  it("keeps an existing booking status when admin form sends an unknown value", () => {
    expect(normalizeAdminBookingStatus("attended", "confirmed")).toBe("attended");
    expect(normalizeAdminBookingStatus("unknown", "confirmed")).toBe("confirmed");
  });

  it("detects whether an admin match form includes editable match fields", () => {
    const publishOnlyForm = new FormData();
    publishOnlyForm.set("eventId", "event-1");
    const editForm = new FormData();
    editForm.set("eventId", "event-1");
    editForm.set("likes:booking-1", "2, 3");

    expect(hasAdminMatchFormEdits(publishOnlyForm)).toBe(false);
    expect(hasAdminMatchFormEdits(editForm)).toBe(true);
  });

  it("normalizes admin match event filters", () => {
    expect(
      normalizeAdminMatchFilters({
        q: `  ${"g".repeat(140)}  `,
        status: "finished",
      }),
    ).toEqual({
      q: "g".repeat(120),
      status: "finished",
    });

    expect(normalizeAdminMatchFilters({ q: "x", status: "invalid" })).toEqual({
      q: "",
      status: "all",
    });
  });
});
