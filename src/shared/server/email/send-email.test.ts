import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createSiteNotification: vi.fn(),
  insertValues: vi.fn(),
  send: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/shared/server/db/client", () => ({
  getDb: () => ({
    insert: () => ({
      values: mocks.insertValues,
    }),
  }),
}));

vi.mock("@/shared/server/db/schema", () => ({
  emailEvents: {},
}));

vi.mock("@/shared/server/notifications/site-notifications", () => ({
  createSiteNotification: mocks.createSiteNotification,
  getEmailSiteNotification: () => ({
    body: "Email body",
    title: "Email title",
    tone: "info",
    type: "email",
  }),
}));

vi.mock("./resend", () => ({
  getDefaultFromEmail: () => "RoundDate <hello@rounddate.pl>",
  getResend: () => ({
    emails: {
      send: mocks.send,
    },
  }),
}));

import { createEmailIdempotencyKey, sendEmail } from "./send-email";

describe("sendEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.EMAIL_DELIVERY_MODE;
    mocks.insertValues.mockResolvedValue(undefined);
    mocks.send.mockResolvedValue({ data: { id: "email_123" }, error: null });
  });

  it("sends through Resend with tags and event reminder idempotency", async () => {
    process.env.EMAIL_DELIVERY_MODE = "resend";

    const result = await sendEmail({
      html: "<p>Reminder</p>",
      metadata: { bookingId: "booking-1" },
      subject: "Reminder",
      template: "event-reminder",
      text: "Reminder",
      to: "ada@example.com",
      userId: "user-1",
    });

    expect(result).toEqual({ delivered: true, providerMessageId: "email_123" });
    expect(mocks.send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "RoundDate <hello@rounddate.pl>",
        tags: expect.arrayContaining([
          { name: "app", value: "rounddate" },
          { name: "template", value: "event-reminder" },
        ]),
        to: "ada@example.com",
      }),
      { idempotencyKey: "event-reminder/booking-1" },
    );
    expect(mocks.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          delivery: "resend",
          idempotencyKey: "event-reminder/booking-1",
          provider: "resend",
          recipientDomain: "example.com",
          tags: expect.objectContaining({
            app: "rounddate",
            template: "event-reminder",
          }),
        }),
        providerMessageId: "email_123",
        template: "event-reminder",
        userId: "user-1",
      }),
    );
    expect(mocks.createSiteNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        dedupeKey: "event-reminder/booking-1",
        metadata: expect.objectContaining({
          delivery: "resend",
          providerMessageId: "email_123",
          template: "event-reminder",
        }),
        userId: "user-1",
      }),
    );
  });

  it("records local disabled emails without calling Resend", async () => {
    const result = await sendEmail({
      html: "<p>Verify</p>",
      subject: "Verify",
      template: "account-verification",
      text: "Verify",
      to: "ada@example.com",
      userId: "user-1",
    });

    expect(result).toEqual({ delivered: false, providerMessageId: null });
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          delivery: "local-disabled",
          recipientDomain: "example.com",
          subject: "Verify",
        }),
        providerMessageId: null,
      }),
    );
    expect(mocks.createSiteNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          delivery: "local-disabled",
          providerMessageId: null,
          template: "account-verification",
        }),
        userId: "user-1",
      }),
    );
  });

  it("records Resend failures before throwing", async () => {
    process.env.EMAIL_DELIVERY_MODE = "resend";
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.send.mockResolvedValue({
      data: null,
      error: {
        message: "The from address is invalid.",
        name: "validation_error",
        statusCode: 422,
      },
    });

    await expect(
      sendEmail({
        html: "<p>Verify</p>",
        subject: "Verify",
        template: "account-verification",
        text: "Verify",
        to: "ada@example.com",
        userId: "user-1",
      }),
    ).rejects.toThrow("The from address is invalid.");

    expect(mocks.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          delivery: "resend-failed",
          error: expect.objectContaining({
            message: "The from address is invalid.",
            name: "validation_error",
            statusCode: 422,
          }),
          provider: "resend",
          recipientDomain: "example.com",
        }),
        providerMessageId: null,
        template: "account-verification",
        userId: "user-1",
      }),
    );
    expect(mocks.createSiteNotification).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it("hashes sensitive auth URLs for idempotency keys", () => {
    const key = createEmailIdempotencyKey(
      "account-verification",
      "https://rounddate.example/verify?token=secret",
    );

    expect(key).toMatch(/^account-verification\/[a-f0-9]{64}$/);
    expect(key).not.toContain("secret");
  });

  it("uses hashed idempotency for new events campaigns", async () => {
    process.env.EMAIL_DELIVERY_MODE = "resend";

    await sendEmail({
      html: "<p>New events</p>",
      metadata: { campaignId: "campaign-1" },
      subject: "New events",
      template: "new-events",
      text: "New events",
      to: "ada@example.com",
      userId: "user-1",
    });

    expect(mocks.send).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        idempotencyKey: expect.stringMatching(/^new-events\/[a-f0-9]{64}$/),
      }),
    );
    expect(mocks.send.mock.calls[0]?.[1]?.idempotencyKey).not.toContain("ada@example.com");
  });
});
