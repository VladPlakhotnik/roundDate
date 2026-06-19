import "server-only";

import { getDb } from "@/shared/server/db/client";
import { emailEvents } from "@/shared/server/db/schema";

import { getDefaultFromEmail, getResend } from "./resend";

export type SendEmailInput = {
  html: string;
  metadata?: Record<string, unknown>;
  subject: string;
  template: string;
  text: string;
  to: string;
  userId?: string | null;
};

function shouldDeliverEmail() {
  if (process.env.EMAIL_DELIVERY_MODE === "resend") {
    return true;
  }

  return process.env.NODE_ENV === "production";
}

export async function sendEmail(input: SendEmailInput) {
  const db = getDb();

  if (!shouldDeliverEmail()) {
    console.info("[email/local-disabled]", input.template, input.to, input.subject);
    await db.insert(emailEvents).values({
      metadata: {
        ...input.metadata,
        delivery: "local-disabled",
        subject: input.subject,
      },
      providerMessageId: null,
      template: input.template,
      userId: input.userId ?? null,
    });

    return { delivered: false, providerMessageId: null };
  }

  const result = await getResend().emails.send({
    from: getDefaultFromEmail(),
    html: input.html,
    subject: input.subject,
    text: input.text,
    to: input.to,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  await db.insert(emailEvents).values({
    metadata: input.metadata ?? {},
    providerMessageId: result.data?.id ?? null,
    template: input.template,
    userId: input.userId ?? null,
  });

  return { delivered: true, providerMessageId: result.data?.id ?? null };
}
