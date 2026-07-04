import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("drizzle-orm", () => ({
  and: (...conditions: unknown[]) => ({ conditions, op: "and" }),
  eq: (left: unknown, right: unknown) => ({ left, op: "eq", right }),
  inArray: (left: unknown, values: unknown[]) => ({ left, op: "inArray", values }),
}));

import { markCheckoutSessionPaid, markCheckoutSessionPaymentFailed } from "./stripe-webhook";

function createDbMock() {
  const setCalls: unknown[] = [];
  const whereCalls: unknown[] = [];
  const db = {
    update: vi.fn(() => ({
      set: vi.fn((value: unknown) => {
        setCalls.push(value);

        return {
          where: vi.fn((value: unknown) => {
            whereCalls.push(value);

            return Promise.resolve();
          }),
        };
      }),
    })),
  };

  return { db, setCalls, whereCalls };
}

describe("markCheckoutSessionPaid", () => {
  it("stores paid date and payment method type for payment history", async () => {
    const { db, setCalls } = createDbMock();

    await markCheckoutSessionPaid(
      {
        client_reference_id: "booking-1",
        id: "cs_test_1",
        metadata: null,
        payment_intent: "pi_test_1",
        payment_method_types: ["card"],
        payment_status: "paid",
      },
      db as never,
    );

    expect(setCalls[1]).toMatchObject({
      paidAt: expect.any(Date),
      paymentMethodType: "card",
      providerPaymentId: "pi_test_1",
      status: "paid",
    });
  });

  it("only confirms active pending-payment bookings from paid webhooks", async () => {
    const { db, whereCalls } = createDbMock();

    await markCheckoutSessionPaid(
      {
        client_reference_id: "booking-1",
        id: "cs_test_1",
        metadata: null,
        payment_intent: "pi_test_1",
        payment_method_types: ["card"],
        payment_status: "paid",
      },
      db as never,
    );

    expect(whereCalls[0]).toMatchObject({
      conditions: expect.arrayContaining([
        expect.objectContaining({
          op: "inArray",
          values: ["pending_payment"],
        }),
      ]),
    });
    expect(whereCalls[1]).toMatchObject({
      conditions: expect.arrayContaining([
        expect.objectContaining({
          op: "eq",
          right: "pending",
        }),
      ]),
    });
  });

  it("only marks active pending-payment bookings as failed from failed webhooks", async () => {
    const { db, whereCalls } = createDbMock();

    await markCheckoutSessionPaymentFailed(
      {
        client_reference_id: "booking-1",
        id: "cs_test_1",
        metadata: null,
        payment_intent: "pi_test_1",
        payment_method_types: ["card"],
        payment_status: "unpaid",
      },
      db as never,
    );

    expect(whereCalls[0]).toMatchObject({
      conditions: expect.arrayContaining([
        expect.objectContaining({
          op: "inArray",
          values: ["pending_payment"],
        }),
      ]),
    });
    expect(whereCalls[1]).toMatchObject({
      conditions: expect.arrayContaining([
        expect.objectContaining({
          op: "eq",
          right: "pending",
        }),
      ]),
    });
  });
});
