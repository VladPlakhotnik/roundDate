import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  stripeConstructor: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("stripe", () => ({
  default: class StripeMock {
    constructor(apiKey: string) {
      mocks.stripeConstructor(apiKey);
    }
  },
}));

async function importStripeModule() {
  vi.resetModules();

  return import("./stripe");
}

describe("getStripe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.STRIPE_API_KEY;
    delete process.env.STRIPE_SECRET_KEY;
  });

  it("prefers STRIPE_API_KEY for restricted API keys", async () => {
    process.env.STRIPE_API_KEY = "rk_test_restricted";
    process.env.STRIPE_SECRET_KEY = "sk_test_legacy";

    const { getStripe } = await importStripeModule();

    getStripe();

    expect(mocks.stripeConstructor).toHaveBeenCalledWith("rk_test_restricted");
  });

  it("falls back to STRIPE_SECRET_KEY for legacy setups", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_legacy";

    const { getStripe } = await importStripeModule();

    getStripe();

    expect(mocks.stripeConstructor).toHaveBeenCalledWith("sk_test_legacy");
  });
});
