import "server-only";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, asc, eq, gte, inArray } from "drizzle-orm";

import { requireAdmin } from "@/admin/auth/require-admin";
import { recordAdminAuditLog } from "@/admin/server/audit-logs";
import { resolveLocale, type Locale } from "@/shared/i18n/locales";
import { listActiveNewsletterRecipients } from "@/shared/server/newsletter/subscriptions";
import { getDb } from "@/shared/server/db/client";
import {
  authUsers,
  emailCampaigns,
  events,
  profiles,
  venues,
} from "@/shared/server/db/schema";
import { sendNewEventsNotification } from "@/shared/server/email/notifications";
import { sendEmail } from "@/shared/server/email/send-email";
import {
  newEventsDefaultDescription,
  newEventsEmail,
  type EmailEventCard,
} from "@/shared/server/email/templates";

type CampaignActor = {
  email: string;
  id: string;
  name: string;
};

export type MarketingCampaignEvent = {
  ageMax: number;
  ageMin: number;
  city: string;
  currency: string;
  id: string;
  imageSrc: string | null;
  priceGroszy: number;
  slug: string;
  spotsAvailable: number;
  startsAt: Date;
  title: string;
  venueAddress: string | null;
  venueName: string | null;
};

export type MarketingCampaignRecipient = {
  email: string;
  firstName: string | null;
  locale: string;
  userId?: string | undefined;
};

export type MarketingCampaignPageData = {
  audience: {
    newsletterRecipients: number;
    profileRecipients: number;
    totalRecipients: number;
  };
  events: MarketingCampaignEvent[];
};

type CampaignSendResult = {
  delivered: boolean;
  providerMessageId: string | null;
  skipped?: string;
};

type CreateCampaignInput = {
  actor: CampaignActor;
  campaignId: string;
  eventIds: string[];
  recipientCount: number;
  summary: string;
};

type FinishCampaignInput = {
  campaignId: string;
  failedCount: number;
  sentCount: number;
  skippedCount: number;
  status: "failed" | "partial_failed" | "sent";
};

type NewEventsCampaignDeps = {
  createCampaign: (input: CreateCampaignInput) => Promise<boolean>;
  finishCampaign: (input: FinishCampaignInput) => Promise<void>;
  getEvents: (eventIds: string[]) => Promise<MarketingCampaignEvent[]>;
  getNewsletterRecipients: () => Promise<MarketingCampaignRecipient[]>;
  getProfileRecipients: () => Promise<MarketingCampaignRecipient[]>;
  recordAuditLog: (input: {
    actor: CampaignActor;
    campaignId: string;
    eventIds: string[];
    failedCount: number;
    recipientCount: number;
    sentCount: number;
  }) => Promise<void>;
  sendNewsletterEmail: (input: {
    campaignId: string;
    events: EmailEventCard[];
    eventsUrl: string;
    locale: Locale;
    to: string;
  }) => Promise<CampaignSendResult>;
  sendProfileNotification: (input: {
    campaignId: string;
    events: EmailEventCard[];
    eventsUrl: string;
    locale: Locale;
    to: string;
    userId: string;
  }) => Promise<CampaignSendResult>;
};

type NewEventsCampaignInput = {
  actor: CampaignActor;
  campaignId: string;
  eventIds: string[];
};

function readString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeCampaignId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
    ? value
    : randomUUID();
}

function isLocalUrl(value: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::|\/|$)/i.test(value);
}

function getPublicAppUrl() {
  const configuredUrl = process.env.EMAIL_PUBLIC_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  const publicUrl = configuredUrl && !isLocalUrl(configuredUrl) ? configuredUrl : "https://rounddate.pl";

  return publicUrl.replace(/\/$/, "");
}

function getEventsUrl() {
  return `${getPublicAppUrl()}/profile/events`;
}

function formatCampaignEventDate(value: Date, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "pl-PL", {
    day: "2-digit",
    month: "long",
    timeZone: "Europe/Warsaw",
  }).format(value);
}

function formatCampaignEventTime(value: Date, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "pl-PL", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    timeZone: "Europe/Warsaw",
  }).format(value);
}

function formatCampaignEventPrice(priceGroszy: number, currency: string) {
  return `${Math.round(priceGroszy / 100)} ${currency}`;
}

function formatCampaignEventSpots(spotsAvailable: number, locale: Locale) {
  if (locale === "en") {
    return spotsAvailable === 1 ? "1 seat" : `${spotsAvailable} seats`;
  }

  if (spotsAvailable === 1) {
    return "1 miejsce";
  }

  if (spotsAvailable > 1 && spotsAvailable < 5) {
    return `${spotsAvailable} miejsca`;
  }

  return `${spotsAvailable} miejsc`;
}

function toEmailEventCards(
  eventsList: MarketingCampaignEvent[],
  eventUrl: string,
  locale: Locale,
): EmailEventCard[] {
  return eventsList.map((event) => ({
    ageRange: `${event.ageMin}-${event.ageMax}`,
    city: event.city,
    eventDate: formatCampaignEventDate(event.startsAt, locale),
    eventTime: formatCampaignEventTime(event.startsAt, locale),
    eventUrl,
    imageSrc: event.imageSrc ?? undefined,
    priceLabel: formatCampaignEventPrice(event.priceGroszy, event.currency),
    spotsLabel: formatCampaignEventSpots(event.spotsAvailable, locale),
    title: event.title,
    venueAddress: event.venueAddress ?? undefined,
    venueName: event.venueName ?? undefined,
  }));
}

function dedupeNewsletterRecipients(
  profileRecipients: MarketingCampaignRecipient[],
  newsletterRecipients: MarketingCampaignRecipient[],
) {
  const profileEmails = new Set(profileRecipients.map((recipient) => normalizeEmail(recipient.email)));

  return newsletterRecipients.filter((recipient) => !profileEmails.has(normalizeEmail(recipient.email)));
}

async function listProfileNewEventsRecipients(): Promise<MarketingCampaignRecipient[]> {
  return getDb()
    .select({
      email: authUsers.email,
      firstName: profiles.firstName,
      locale: profiles.locale,
      userId: authUsers.id,
    })
    .from(authUsers)
    .innerJoin(profiles, eq(profiles.userId, authUsers.id))
    .where(
      and(
        eq(authUsers.banned, false),
        eq(authUsers.emailVerified, true),
        eq(profiles.marketingConsent, true),
      ),
    )
    .limit(5000);
}

async function listCampaignEvents(eventIds: string[]): Promise<MarketingCampaignEvent[]> {
  if (!eventIds.length) {
    return [];
  }

  return getDb()
    .select({
      ageMax: events.ageMax,
      ageMin: events.ageMin,
      city: events.city,
      currency: events.currency,
      id: events.id,
      imageSrc: events.imageSrc,
      priceGroszy: events.priceGroszy,
      slug: events.slug,
      spotsAvailable: events.spotsAvailable,
      startsAt: events.startsAt,
      title: events.title,
      venueAddress: venues.address,
      venueName: venues.name,
    })
    .from(events)
    .leftJoin(venues, eq(events.venueId, venues.id))
    .where(and(inArray(events.id, eventIds), inArray(events.status, ["published", "sold_out"])))
    .orderBy(asc(events.startsAt));
}

async function listCampaignEventOptions(): Promise<MarketingCampaignEvent[]> {
  return getDb()
    .select({
      ageMax: events.ageMax,
      ageMin: events.ageMin,
      city: events.city,
      currency: events.currency,
      id: events.id,
      imageSrc: events.imageSrc,
      priceGroszy: events.priceGroszy,
      slug: events.slug,
      spotsAvailable: events.spotsAvailable,
      startsAt: events.startsAt,
      title: events.title,
      venueAddress: venues.address,
      venueName: venues.name,
    })
    .from(events)
    .leftJoin(venues, eq(events.venueId, venues.id))
    .where(and(inArray(events.status, ["published", "sold_out"]), gte(events.startsAt, new Date())))
    .orderBy(asc(events.startsAt))
    .limit(24);
}

async function createEmailCampaign(input: CreateCampaignInput) {
  const [row] = await getDb()
    .insert(emailCampaigns)
    .values({
      createdByUserId: input.actor.id,
      eventIds: input.eventIds,
      id: input.campaignId,
      recipientCount: input.recipientCount,
      status: "sending",
      subject: "RoundDate: nowe wydarzenia",
      summary: input.summary,
      type: "new-events",
    })
    .onConflictDoNothing({ target: emailCampaigns.id })
    .returning({ id: emailCampaigns.id });

  return Boolean(row);
}

async function finishEmailCampaign(input: FinishCampaignInput) {
  await getDb()
    .update(emailCampaigns)
    .set({
      failedCount: input.failedCount,
      sentCount: input.sentCount,
      skippedCount: input.skippedCount,
      status: input.status,
      updatedAt: new Date(),
    })
    .where(eq(emailCampaigns.id, input.campaignId));
}

async function sendNewsletterNewEventsEmail(input: {
  campaignId: string;
  events: EmailEventCard[];
  eventsUrl: string;
  locale: Locale;
  to: string;
}) {
  const template = newEventsEmail({
    events: input.events,
    eventsUrl: input.eventsUrl,
    locale: input.locale,
  });

  return sendEmail({
    ...template,
    metadata: {
      campaignId: input.campaignId,
      notificationActionUrl: input.eventsUrl,
      notificationType: "new-events",
      recipientType: "newsletter",
    },
    siteNotification: false,
    template: "new-events",
    to: input.to,
    userId: null,
  });
}

async function sendProfileNewEventsNotification(input: {
  campaignId: string;
  events: EmailEventCard[];
  eventsUrl: string;
  locale: Locale;
  to: string;
  userId: string;
}) {
  return sendNewEventsNotification({
    events: input.events,
    eventsUrl: input.eventsUrl,
    locale: input.locale,
    metadata: {
      campaignId: input.campaignId,
      recipientType: "profile",
    },
    to: input.to,
    userId: input.userId,
  });
}

async function recordCampaignAuditLog(input: {
  actor: CampaignActor;
  campaignId: string;
  eventIds: string[];
  failedCount: number;
  recipientCount: number;
  sentCount: number;
}) {
  await recordAdminAuditLog({
    action: "email_campaign.sent",
    actor: input.actor,
    entityId: input.campaignId,
    entityType: "email_campaign",
    metadata: {
      eventIds: input.eventIds,
      failedCount: input.failedCount,
      recipientCount: input.recipientCount,
      sentCount: input.sentCount,
    },
    summary: `Wysłano kampanię email new-events do ${input.sentCount}/${input.recipientCount} odbiorców.`,
  });
}

function defaultCampaignDeps(): NewEventsCampaignDeps {
  return {
    createCampaign: createEmailCampaign,
    finishCampaign: finishEmailCampaign,
    getEvents: listCampaignEvents,
    getNewsletterRecipients: () => listActiveNewsletterRecipients(5000),
    getProfileRecipients: listProfileNewEventsRecipients,
    recordAuditLog: recordCampaignAuditLog,
    sendNewsletterEmail: sendNewsletterNewEventsEmail,
    sendProfileNotification: sendProfileNewEventsNotification,
  };
}

export async function getAdminMarketingCampaignPageData(): Promise<MarketingCampaignPageData> {
  await requireAdmin();

  const [eventsList, profileRecipients, newsletterRecipients] = await Promise.all([
    listCampaignEventOptions(),
    listProfileNewEventsRecipients(),
    listActiveNewsletterRecipients(5000),
  ]);
  const dedupedNewsletterRecipients = dedupeNewsletterRecipients(
    profileRecipients,
    newsletterRecipients,
  );

  return {
    audience: {
      newsletterRecipients: dedupedNewsletterRecipients.length,
      profileRecipients: profileRecipients.length,
      totalRecipients: profileRecipients.length + dedupedNewsletterRecipients.length,
    },
    events: eventsList,
  };
}

export async function sendNewEventsCampaign(
  input: NewEventsCampaignInput,
  deps: NewEventsCampaignDeps = defaultCampaignDeps(),
) {
  const uniqueEventIds = [...new Set(input.eventIds.map((id) => id.trim()).filter(Boolean))];
  const eventsList = await deps.getEvents(uniqueEventIds);
  const summary = newEventsDefaultDescription;
  const [profileRecipients, newsletterRecipients] = await Promise.all([
    deps.getProfileRecipients(),
    deps.getNewsletterRecipients(),
  ]);
  const dedupedNewsletterRecipients = dedupeNewsletterRecipients(
    profileRecipients,
    newsletterRecipients,
  );
  const recipientCount = profileRecipients.length + dedupedNewsletterRecipients.length;
  const created = await deps.createCampaign({
    actor: input.actor,
    campaignId: input.campaignId,
    eventIds: eventsList.map((event) => event.id),
    recipientCount,
    summary,
  });

  if (!created) {
    return {
      campaignId: input.campaignId,
      failedCount: 0,
      newsletterRecipientCount: 0,
      profileRecipientCount: 0,
      recipientCount: 0,
      sentCount: 0,
      skippedCount: 0,
      status: "duplicate" as const,
    };
  }

  const eventsUrl = getEventsUrl();
  const results = await Promise.allSettled([
    ...profileRecipients.map((recipient) => {
      const locale = resolveLocale(recipient.locale);

      return recipient.userId
        ? deps.sendProfileNotification({
            campaignId: input.campaignId,
            events: toEmailEventCards(eventsList, eventsUrl, locale),
            eventsUrl,
            locale,
            to: recipient.email,
            userId: recipient.userId,
          })
        : Promise.resolve({ delivered: false, providerMessageId: null, skipped: "missing-user" });
    }),
    ...dedupedNewsletterRecipients.map((recipient) => {
      const locale = resolveLocale(recipient.locale);

      return deps.sendNewsletterEmail({
        campaignId: input.campaignId,
        events: toEmailEventCards(eventsList, eventsUrl, locale),
        eventsUrl,
        locale,
        to: recipient.email,
      });
    }),
  ]);
  const failedCount = results.filter((result) => result.status === "rejected").length;
  const skippedCount = results.filter(
    (result) => result.status === "fulfilled" && Boolean(result.value.skipped),
  ).length;
  const sentCount = results.length - failedCount - skippedCount;
  const status = failedCount > 0 ? "partial_failed" : "sent";

  await deps.finishCampaign({
    campaignId: input.campaignId,
    failedCount,
    sentCount,
    skippedCount,
    status,
  });
  await deps.recordAuditLog({
    actor: input.actor,
    campaignId: input.campaignId,
    eventIds: eventsList.map((event) => event.id),
    failedCount,
    recipientCount,
    sentCount,
  });

  return {
    campaignId: input.campaignId,
    failedCount,
    newsletterRecipientCount: dedupedNewsletterRecipients.length,
    profileRecipientCount: profileRecipients.length,
    recipientCount,
    sentCount,
    skippedCount,
    status,
  };
}

export async function sendNewEventsCampaignAction(formData: FormData) {
  "use server";

  const actor = await requireAdmin();
  const campaignId = normalizeCampaignId(readString(formData, "campaignId"));
  const eventIds = formData
    .getAll("eventId")
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);

  if (!eventIds.length) {
    redirect("/admin/marketing?status=no_events&sent=0&failed=0&recipients=0");
  }

  const result = await sendNewEventsCampaign({
    actor,
    campaignId,
    eventIds,
  });
  const params = new URLSearchParams({
    campaign: result.campaignId,
    failed: String(result.failedCount),
    recipients: String(result.recipientCount),
    sent: String(result.sentCount),
    status: result.status,
  });

  revalidatePath("/admin/marketing");
  redirect(`/admin/marketing?${params.toString()}`);
}
