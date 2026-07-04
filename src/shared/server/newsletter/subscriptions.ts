import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { resolveLocale } from "@/shared/i18n/locales";
import { getDb } from "@/shared/server/db/client";
import { newsletterSubscriptions } from "@/shared/server/db/schema";

export type NewsletterSubscriptionInput = {
  age: number;
  email: string;
  firstName: string;
  gender: string;
  locale: string;
  source?: string;
};

export type NewsletterSubscriptionResult = {
  email: string;
  firstName: string;
};

export type NewsletterRecipient = {
  email: string;
  firstName: string;
  locale: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeText(value: string) {
  return value.trim();
}

export async function subscribeToNewsletter(
  input: NewsletterSubscriptionInput,
): Promise<NewsletterSubscriptionResult> {
  const now = new Date();
  const email = normalizeEmail(input.email);
  const firstName = normalizeText(input.firstName);
  const gender = normalizeText(input.gender);
  const locale = resolveLocale(normalizeText(input.locale));
  const source = normalizeText(input.source ?? "home_waitlist") || "home_waitlist";

  const [subscription] = await getDb()
    .insert(newsletterSubscriptions)
    .values({
      age: input.age,
      email,
      firstName,
      gender,
      locale,
      marketingConsent: true,
      source,
      subscribedAt: now,
      unsubscribedAt: null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      set: {
        age: input.age,
        firstName,
        gender,
        locale,
        marketingConsent: true,
        source,
        subscribedAt: now,
        unsubscribedAt: null,
        updatedAt: now,
      },
      target: newsletterSubscriptions.email,
    })
    .returning({
      email: newsletterSubscriptions.email,
      firstName: newsletterSubscriptions.firstName,
    });

  return subscription ?? { email, firstName };
}

export async function listActiveNewsletterRecipients(limit = 1000): Promise<NewsletterRecipient[]> {
  return getDb()
    .select({
      email: newsletterSubscriptions.email,
      firstName: newsletterSubscriptions.firstName,
      locale: newsletterSubscriptions.locale,
    })
    .from(newsletterSubscriptions)
    .where(
      and(
        eq(newsletterSubscriptions.marketingConsent, true),
        isNull(newsletterSubscriptions.unsubscribedAt),
      ),
    )
    .limit(limit);
}
