import "server-only";

import { createHash } from "node:crypto";

import { getDb } from "@/shared/server/db/client";
import { emailEvents } from "@/shared/server/db/schema";
import {
  createSiteNotification,
  getEmailSiteNotification,
  type SiteNotificationDraft,
} from "@/shared/server/notifications/site-notifications";

import { getDefaultFromEmail, getResend } from "./resend";

type EmailTag = {
  name: string;
  value: string;
};

type EmailDelivery = "local-disabled" | "resend" | "resend-failed";

export type SendEmailInput = {
  html: string;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
  siteNotification?: false | SiteNotificationDraft;
  subject: string;
  template: string;
  text: string;
  to: string;
  userId?: string | null;
};

function shouldDeliverEmail() {
  if (process.env.EMAIL_DELIVERY_MODE === "disabled") {
    return false;
  }

  if (process.env.EMAIL_DELIVERY_MODE === "resend") {
    return true;
  }

  return process.env.NODE_ENV === "production";
}

function sanitizeTagValue(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 256) || "unknown";
}

function getRecipientDomain(email: string) {
  const match = email.match(/@([^>\s,]+)/);

  return match?.[1]?.toLowerCase() ?? null;
}

function getMetadataString(metadata: Record<string, unknown> | undefined, key: string) {
  const value = metadata?.[key];

  return typeof value === "string" && value ? value : null;
}

function buildEmailTags(input: SendEmailInput): EmailTag[] {
  return [
    { name: "app", value: "rounddate" },
    { name: "template", value: sanitizeTagValue(input.template) },
    { name: "environment", value: sanitizeTagValue(process.env.NODE_ENV ?? "development") },
  ];
}

function getDefaultIdempotencyKey(input: SendEmailInput) {
  if (input.idempotencyKey) {
    return input.idempotencyKey.slice(0, 256);
  }

  const bookingId = getMetadataString(input.metadata, "bookingId");
  if (input.template === "event-reminder" && bookingId) {
    return `event-reminder/${bookingId}`.slice(0, 256);
  }

  const eventId = getMetadataString(input.metadata, "eventId");
  if (input.template === "event-result" && eventId && input.userId) {
    return `event-result/${eventId}/${input.userId}`.slice(0, 256);
  }

  const campaignId = getMetadataString(input.metadata, "campaignId");
  if (input.template === "new-events" && campaignId) {
    return createEmailIdempotencyKey("new-events", `${campaignId}/${input.userId ?? input.to}`);
  }

  return undefined;
}

function serializeEmailError(error: unknown) {
  if (!error || typeof error !== "object") {
    return { message: String(error) };
  }

  const value = error as {
    code?: unknown;
    message?: unknown;
    name?: unknown;
    status?: unknown;
    statusCode?: unknown;
  };

  return {
    code: typeof value.code === "string" ? value.code : undefined,
    message: typeof value.message === "string" ? value.message : "Unknown email provider error.",
    name: typeof value.name === "string" ? value.name : undefined,
    status: typeof value.status === "number" ? value.status : undefined,
    statusCode: typeof value.statusCode === "number" ? value.statusCode : undefined,
  };
}

function buildEmailEventMetadata(
  input: SendEmailInput,
  delivery: EmailDelivery,
  extra?: Record<string, unknown>,
) {
  const tags = buildEmailTags(input);
  const idempotencyKey = getDefaultIdempotencyKey(input);

  return {
    ...input.metadata,
    ...extra,
    delivery,
    from: getDefaultFromEmail(),
    idempotencyKey,
    provider: delivery === "local-disabled" ? "local" : "resend",
    recipientDomain: getRecipientDomain(input.to),
    subject: input.subject,
    tags: Object.fromEntries(tags.map((tag) => [tag.name, tag.value])),
  };
}

async function createNotificationForEmail(
  input: SendEmailInput,
  delivery: EmailDelivery,
  providerMessageId: null | string,
) {
  if (!input.userId || input.siteNotification === false) {
    return;
  }

  const notification =
    input.siteNotification ??
    getEmailSiteNotification({
      metadata: input.metadata,
      subject: input.subject,
      template: input.template,
    });

  if (!notification) {
    return;
  }

  await createSiteNotification({
    ...notification,
    dedupeKey: notification.dedupeKey ?? getDefaultIdempotencyKey(input) ?? null,
    metadata: {
      ...input.metadata,
      delivery,
      providerMessageId,
      template: input.template,
    },
    userId: input.userId,
  });
}

export function createEmailIdempotencyKey(namespace: string, value: string) {
  const digest = createHash("sha256").update(value).digest("hex");

  return `${namespace}/${digest}`.slice(0, 256);
}

export async function sendEmail(input: SendEmailInput) {
  const db = getDb();
  const idempotencyKey = getDefaultIdempotencyKey(input);
  const tags = buildEmailTags(input);

  if (!shouldDeliverEmail()) {
    console.info("[email/local-disabled]", input.template, input.to, input.subject);
    await db.insert(emailEvents).values({
      metadata: buildEmailEventMetadata(input, "local-disabled"),
      providerMessageId: null,
      template: input.template,
      userId: input.userId ?? null,
    });
    await createNotificationForEmail(input, "local-disabled", null);

    return { delivered: false, providerMessageId: null };
  }

  const result = await getResend().emails.send(
    {
      from: getDefaultFromEmail(),
      html: input.html,
      subject: input.subject,
      tags,
      text: input.text,
      to: input.to,
    },
    idempotencyKey ? { idempotencyKey } : undefined,
  );

  if (result.error) {
    const error = serializeEmailError(result.error);

    console.error("[email/resend-failed]", {
      error,
      recipientDomain: getRecipientDomain(input.to),
      template: input.template,
      userId: input.userId ?? null,
    });

    try {
      await db.insert(emailEvents).values({
        metadata: buildEmailEventMetadata(input, "resend-failed", { error }),
        providerMessageId: null,
        template: input.template,
        userId: input.userId ?? null,
      });
    } catch (eventError) {
      console.error("[email/resend-failed-event-log]", serializeEmailError(eventError));
    }

    throw new Error(result.error.message);
  }

  await db.insert(emailEvents).values({
    metadata: buildEmailEventMetadata(input, "resend"),
    providerMessageId: result.data?.id ?? null,
    template: input.template,
    userId: input.userId ?? null,
  });
  await createNotificationForEmail(input, "resend", result.data?.id ?? null);

  return { delivered: true, providerMessageId: result.data?.id ?? null };
}
