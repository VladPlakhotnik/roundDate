import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  insertValues: vi.fn(),
  selectLimit: vi.fn(),
  verify: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("drizzle-orm", () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values }),
}));

vi.mock("@/shared/server/db/client", () => ({
  getDb: () => ({
    insert: () => ({
      values: mocks.insertValues,
    }),
    select: () => ({
      from: () => ({
        where: () => ({
          limit: mocks.selectLimit,
        }),
      }),
    }),
  }),
}));

vi.mock("@/shared/server/db/schema", () => ({
  emailEvents: {
    id: "emailEvents.id",
    metadata: "emailEvents.metadata",
  },
}));

vi.mock("@/shared/server/email/resend", () => ({
  getResend: () => ({
    webhooks: {
      verify: mocks.verify,
    },
  }),
}));

import { POST } from "./route";

function signedRequest(body: string) {
  return new Request("https://rounddate.example/api/webhooks/resend", {
    body,
    headers: {
      "svix-id": "msg_123",
      "svix-signature": "v1,signed",
      "svix-timestamp": "1782957134",
    },
    method: "POST",
  });
}

describe("Resend webhook route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_WEBHOOK_SECRET = "whsec_test";
    mocks.insertValues.mockResolvedValue(undefined);
    mocks.selectLimit.mockResolvedValue([]);
    mocks.verify.mockReturnValue({
      created_at: "2026-07-02T12:00:00.000Z",
      data: {
        created_at: "2026-07-02T12:00:00.000Z",
        email_id: "email_123",
        from: "RoundDate <hello@rounddate.pl>",
        subject: "Verify",
        tags: { template: "account-verification" },
        to: ["ada@example.com"],
      },
      type: "email.delivered",
    });
  });

  it("verifies the Resend signature and stores scrubbed delivery metadata", async () => {
    const response = await POST(signedRequest('{"type":"email.delivered"}'));

    await expect(response.json()).resolves.toEqual({ received: true });
    expect(response.status).toBe(200);
    expect(mocks.verify).toHaveBeenCalledWith({
      headers: {
        id: "msg_123",
        signature: "v1,signed",
        timestamp: "1782957134",
      },
      payload: '{"type":"email.delivered"}',
      webhookSecret: "whsec_test",
    });
    expect(mocks.insertValues).toHaveBeenCalledWith({
      metadata: expect.objectContaining({
        eventType: "email.delivered",
        fromDomain: "rounddate.pl",
        provider: "resend",
        recipientDomains: ["example.com"],
        subject: "Verify",
        svixId: "msg_123",
        tags: { template: "account-verification" },
        webhook: true,
      }),
      providerMessageId: "email_123",
      template: "account-verification",
      userId: null,
    });
  });

  it("accepts duplicate signed events without inserting another row", async () => {
    mocks.selectLimit.mockResolvedValue([{ id: "existing-event" }]);

    const response = await POST(signedRequest('{"type":"email.delivered"}'));

    await expect(response.json()).resolves.toEqual({ duplicate: true, received: true });
    expect(response.status).toBe(200);
    expect(mocks.insertValues).not.toHaveBeenCalled();
  });

  it("rejects missing or invalid signatures", async () => {
    const missingHeadersResponse = await POST(
      new Request("https://rounddate.example/api/webhooks/resend", {
        body: "{}",
        method: "POST",
      }),
    );

    expect(missingHeadersResponse.status).toBe(400);

    mocks.verify.mockImplementation(() => {
      throw new Error("invalid");
    });

    const invalidSignatureResponse = await POST(signedRequest("{}"));

    expect(invalidSignatureResponse.status).toBe(400);
    expect(mocks.insertValues).not.toHaveBeenCalled();
  });
});
