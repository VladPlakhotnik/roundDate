import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  recordAdminAuditLog: vi.fn(),
  requireAdmin: vi.fn(),
  revalidatePath: vi.fn(),
  selectRows: [] as unknown[][],
  sendEventResultNotification: vi.fn(),
  updateSet: vi.fn(),
  updateWhere: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("@/admin/auth/require-admin", () => ({
  requireAdmin: mocks.requireAdmin,
}));

vi.mock("@/admin/server/audit-logs", () => ({
  recordAdminAuditLog: mocks.recordAdminAuditLog,
}));

vi.mock("@/shared/server/db/client", () => ({
  getDb: mocks.getDb,
}));

vi.mock("@/shared/server/email/notifications", () => ({
  sendEventResultNotification: mocks.sendEventResultNotification,
}));

import { publishAdminEventMatchesAction } from "./matches";

function createSelectChain(rows: unknown[]) {
  const chain = {
    from: vi.fn(() => chain),
    innerJoin: vi.fn(() => chain),
    leftJoin: vi.fn(() => chain),
    limit: vi.fn(async () => rows),
    then: (resolve: (value: unknown[]) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(rows).then(resolve, reject),
    where: vi.fn(() => chain),
  };

  return chain;
}

function createDb() {
  return {
    select: vi.fn(() => createSelectChain(mocks.selectRows.shift() ?? [])),
    update: vi.fn(() => ({
      set: mocks.updateSet.mockReturnValue({
        where: mocks.updateWhere,
      }),
    })),
  };
}

function createPublishFormData() {
  const formData = new FormData();

  formData.set("eventId", "event-1");

  return formData;
}

describe("publishAdminEventMatchesAction", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-02T10:15:00.000Z"));
    vi.clearAllMocks();
    mocks.selectRows.length = 0;
    mocks.requireAdmin.mockResolvedValue({
      email: "admin@example.com",
      id: "admin-1",
      image: null,
      name: "Admin",
      role: "admin",
    });
    mocks.recordAdminAuditLog.mockResolvedValue(undefined);
    mocks.sendEventResultNotification.mockResolvedValue({
      delivered: false,
      providerMessageId: null,
    });
    mocks.updateWhere.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("publishes results, sends every participant their match count and records audit metadata", async () => {
    mocks.selectRows.push(
      [
        {
          metadata: { existing: true },
          title: "Speed dating 30-40",
        },
      ],
      [
        {
          bookingId: "booking-a",
          email: "anna@example.com",
          locale: "pl",
          userId: "user-a",
        },
        {
          bookingId: "booking-b",
          email: "bartek@example.com",
          locale: "en",
          userId: "user-b",
        },
        {
          bookingId: "booking-c",
          email: "celina@example.com",
          locale: "pl",
          userId: "user-c",
        },
      ],
      [
        { fromBookingId: "booking-a", toBookingId: "booking-b" },
        { fromBookingId: "booking-b", toBookingId: "booking-a" },
        { fromBookingId: "booking-c", toBookingId: "booking-a" },
      ],
    );
    mocks.getDb.mockReturnValue(createDb());

    await publishAdminEventMatchesAction(createPublishFormData());

    expect(mocks.requireAdmin).toHaveBeenCalledTimes(1);
    expect(mocks.updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          existing: true,
          matchResultsPublishedAt: "2026-07-02T10:15:00.000Z",
          matchResultsPublishedByAdminId: "admin-1",
        }),
      }),
    );
    expect(mocks.sendEventResultNotification).toHaveBeenCalledTimes(3);
    expect(mocks.sendEventResultNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        matchCount: 1,
        metadata: expect.objectContaining({
          bookingId: "booking-a",
          eventId: "event-1",
          matchCount: 1,
        }),
        locale: "pl",
        resultsUrl: "https://rounddate.pl/profile/matches",
        to: "anna@example.com",
        userId: "user-a",
      }),
    );
    expect(mocks.sendEventResultNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        matchCount: 0,
        metadata: expect.objectContaining({
          bookingId: "booking-c",
          eventId: "event-1",
          matchCount: 0,
        }),
        locale: "pl",
        to: "celina@example.com",
        userId: "user-c",
      }),
    );
    expect(mocks.sendEventResultNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        locale: "en",
        to: "bartek@example.com",
        userId: "user-b",
      }),
    );
    expect(mocks.recordAdminAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "matches.published",
        metadata: expect.objectContaining({
          eventId: "event-1",
          notificationsFailed: 0,
          notificationsSent: 3,
          participantsCount: 3,
        }),
      }),
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/matches");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/profile/matches");
  });
});
