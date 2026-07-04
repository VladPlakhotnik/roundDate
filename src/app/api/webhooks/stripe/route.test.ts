import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  markCheckoutSessionExpired: vi.fn(),
  markCheckoutSessionPaid: vi.fn(),
  markCheckoutSessionPaymentFailed: vi.fn(),
}));

vi.mock("@/shared/server/payments/stripe", () => ({
  getStripe: () => ({
    webhooks: {
      constructEvent: mocks.constructEvent,
    },
  }),
}));

vi.mock("@/shared/server/payments/stripe-webhook", () => ({
  markCheckoutSessionExpired: mocks.markCheckoutSessionExpired,
  markCheckoutSessionPaid: mocks.markCheckoutSessionPaid,
  markCheckoutSessionPaymentFailed: mocks.markCheckoutSessionPaymentFailed,
}));

import { POST } from "./route";

describe("Stripe webhook route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  });

  it("verifies the Stripe signature and handles completed Checkout sessions", async () => {
    const checkoutSession = { id: "cs_test_1", object: "checkout.session" };
    mocks.constructEvent.mockReturnValue({
      data: { object: checkoutSession },
      type: "checkout.session.completed",
    });

    const response = await POST(
      new Request("https://rounddate.example/api/webhooks/stripe", {
        body: '{"id":"evt_1"}',
        headers: {
          "stripe-signature": "signed-payload",
        },
        method: "POST",
      }),
    );

    await expect(response.json()).resolves.toEqual({ received: true });
    expect(response.status).toBe(200);
    expect(mocks.constructEvent).toHaveBeenCalledWith(
      '{"id":"evt_1"}',
      "signed-payload",
      "whsec_test",
    );
    expect(mocks.markCheckoutSessionPaid).toHaveBeenCalledWith(checkoutSession);
  });

  it("confirms delayed Checkout payments after async success", async () => {
    const checkoutSession = { id: "cs_test_async", object: "checkout.session" };
    mocks.constructEvent.mockReturnValue({
      data: { object: checkoutSession },
      type: "checkout.session.async_payment_succeeded",
    });

    const response = await POST(
      new Request("https://rounddate.example/api/webhooks/stripe", {
        body: '{"id":"evt_async"}',
        headers: {
          "stripe-signature": "signed-payload",
        },
        method: "POST",
      }),
    );

    await expect(response.json()).resolves.toEqual({ received: true });
    expect(mocks.markCheckoutSessionPaid).toHaveBeenCalledWith(checkoutSession);
  });

  it("marks delayed Checkout payments as failed after async failure", async () => {
    const checkoutSession = { id: "cs_test_failed", object: "checkout.session" };
    mocks.constructEvent.mockReturnValue({
      data: { object: checkoutSession },
      type: "checkout.session.async_payment_failed",
    });

    const response = await POST(
      new Request("https://rounddate.example/api/webhooks/stripe", {
        body: '{"id":"evt_failed"}',
        headers: {
          "stripe-signature": "signed-payload",
        },
        method: "POST",
      }),
    );

    await expect(response.json()).resolves.toEqual({ received: true });
    expect(mocks.markCheckoutSessionPaymentFailed).toHaveBeenCalledWith(checkoutSession);
  });
});
