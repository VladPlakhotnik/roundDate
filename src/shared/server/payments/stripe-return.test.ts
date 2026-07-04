import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  constructQuery: [] as unknown[],
  createSiteNotification: vi.fn(),
  getSession: vi.fn(),
  retrieveCheckoutSession: vi.fn(),
  selectLimit: vi.fn(),
  updateWhere: vi.fn(),
  updateSet: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("drizzle-orm", () => ({
  and: (...args: unknown[]) => ({ args, op: "and" }),
  eq: (...args: unknown[]) => ({ args, op: "eq" }),
  inArray: (...args: unknown[]) => ({ args, op: "inArray" }),
}));

vi.mock("@/shared/server/auth/auth", () => ({
  getAuth: () => ({
    api: {
      getSession: mocks.getSession,
    },
  }),
}));

vi.mock("@/shared/server/db/client", () => ({
  getDb: () => ({
    select: () => ({
      from: () => {
        const queryChain = {
          innerJoin: () => queryChain,
          where: (query: unknown) => {
            mocks.constructQuery.push(query);

            return {
              limit: mocks.selectLimit,
            };
          },
        };

        return queryChain;
      },
    }),
    update: () => ({
      set: mocks.updateSet.mockReturnValue({
        where: mocks.updateWhere,
      }),
    }),
  }),
}));

vi.mock("@/shared/server/db/schema", () => ({
  bookings: {
    eventId: "bookings.eventId",
    id: "bookings.id",
    status: "bookings.status",
    stripeCheckoutSessionId: "bookings.stripeCheckoutSessionId",
    updatedAt: "bookings.updatedAt",
    userId: "bookings.userId",
  },
  events: {
    id: "events.id",
    title: "events.title",
  },
  payments: {
    bookingId: "payments.bookingId",
    providerPaymentId: "payments.providerPaymentId",
    status: "payments.status",
    updatedAt: "payments.updatedAt",
  },
}));

vi.mock("@/shared/server/notifications/site-notifications", () => ({
  createSiteNotification: mocks.createSiteNotification,
}));

vi.mock("@/shared/server/payments/stripe", () => ({
  getStripe: () => ({
    checkout: {
      sessions: {
        retrieve: mocks.retrieveCheckoutSession,
      },
    },
  }),
}));

import { syncCheckoutSessionForCurrentUser } from "./stripe-return";

describe("syncCheckoutSessionForCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.constructQuery = [];
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.retrieveCheckoutSession.mockResolvedValue({
      client_reference_id: "booking-1",
      id: "cs_test_1",
      metadata: { bookingId: "booking-1" },
      payment_intent: "pi_test_1",
      payment_status: "paid",
    });
    mocks.selectLimit
      .mockResolvedValueOnce([{ id: "booking-1" }])
      .mockResolvedValueOnce([{ eventTitle: "RoundDate 25-35", userId: "user-1" }]);
  });

  it("confirms a paid Checkout Session only for the current user's booking", async () => {
    const result = await syncCheckoutSessionForCurrentUser({
      headers: new Headers(),
      sessionId: "cs_test_1",
    });

    expect(result).toEqual({ ok: true, status: "processed" });
    expect(mocks.retrieveCheckoutSession).toHaveBeenCalledWith("cs_test_1");
    expect(mocks.selectLimit).toHaveBeenCalledWith(1);
    expect(mocks.updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "confirmed",
      }),
    );
    expect(mocks.updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        providerPaymentId: "pi_test_1",
        status: "paid",
      }),
    );
  });

  it("does not confirm sessions owned by another user", async () => {
    mocks.selectLimit.mockReset();
    mocks.selectLimit.mockResolvedValue([]);

    const result = await syncCheckoutSessionForCurrentUser({
      headers: new Headers(),
      sessionId: "cs_test_1",
    });

    expect(result).toEqual({ ok: false, status: "not_found" });
    expect(mocks.updateSet).not.toHaveBeenCalled();
  });
});
