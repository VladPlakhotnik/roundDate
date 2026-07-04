import { sql } from "drizzle-orm";
import type { WebhookEventPayload } from "resend";

import { getDb } from "@/shared/server/db/client";
import { emailEvents } from "@/shared/server/db/schema";
import { getResend } from "@/shared/server/email/resend";

export const runtime = "nodejs";

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function domainFromEmailAddress(address: string) {
  const match = address.match(/@([^>\s,]+)/);

  return match?.[1]?.toLowerCase() ?? null;
}

function getEmailData(event: WebhookEventPayload) {
  return "email_id" in event.data ? event.data : null;
}

function getEmailTags(event: WebhookEventPayload) {
  const emailData = getEmailData(event);

  return emailData && "tags" in emailData ? (emailData.tags ?? {}) : {};
}

function getTemplate(event: WebhookEventPayload) {
  const tags = getEmailTags(event);

  return tags.template ?? event.type;
}

function getProviderMessageId(event: WebhookEventPayload) {
  const emailData = getEmailData(event);

  return emailData?.email_id ?? ("id" in event.data ? event.data.id : null);
}

function getEventDetails(event: WebhookEventPayload) {
  switch (event.type) {
    case "email.bounced":
      return { bounce: event.data.bounce };
    case "email.clicked":
      return {
        click: {
          linkHost: (() => {
            try {
              return new URL(event.data.click.link).host;
            } catch {
              return null;
            }
          })(),
          timestamp: event.data.click.timestamp,
        },
      };
    case "email.failed":
      return { failed: event.data.failed };
    case "email.suppressed":
      return { suppressed: event.data.suppressed };
    default:
      return {};
  }
}

function buildMetadata(event: WebhookEventPayload, svixId: string) {
  const emailData = getEmailData(event);

  return {
    ...getEventDetails(event),
    eventCreatedAt: event.created_at,
    eventType: event.type,
    fromDomain: emailData ? domainFromEmailAddress(emailData.from) : null,
    provider: "resend",
    recipientDomains: emailData?.to.map(domainFromEmailAddress) ?? [],
    subject: emailData?.subject ?? null,
    svixId,
    tags: getEmailTags(event),
    webhook: true,
  };
}

export async function POST(request: Request) {
  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return jsonError("Missing Resend webhook signature headers.", 400);
  }

  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return jsonError("RESEND_WEBHOOK_SECRET is not configured.", 500);
  }

  const payload = await request.text();
  let event: WebhookEventPayload;

  try {
    event = getResend().webhooks.verify({
      headers: {
        id: svixId,
        signature: svixSignature,
        timestamp: svixTimestamp,
      },
      payload,
      webhookSecret,
    });
  } catch {
    return jsonError("Invalid Resend webhook signature.", 400);
  }

  const db = getDb();
  const [existingEvent] = await db
    .select({ id: emailEvents.id })
    .from(emailEvents)
    .where(sql`${emailEvents.metadata}->>'svixId' = ${svixId}`)
    .limit(1);

  if (existingEvent) {
    return Response.json({ duplicate: true, received: true });
  }

  await db.insert(emailEvents).values({
    metadata: buildMetadata(event, svixId),
    providerMessageId: getProviderMessageId(event),
    template: getTemplate(event),
    userId: null,
  });

  return Response.json({ received: true });
}
