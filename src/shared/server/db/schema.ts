import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "manager", "admin"]);
export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "pending_payment",
  "confirmed",
  "waitlisted",
  "cancelled",
  "attended",
  "no_show",
  "payment_failed",
  "refunded",
]);
export const eventStatusEnum = pgEnum("event_status", [
  "draft",
  "published",
  "sold_out",
  "finished",
  "cancelled",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "refunded",
  "failed",
]);

export const authUsers = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("emailVerified").notNull().default(false),
    image: text("image"),
    role: userRoleEnum("role").notNull().default("user"),
    banned: boolean("banned").notNull().default(false),
    banReason: text("banReason"),
    banExpires: timestamp("banExpires", { withTimezone: true }),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("user_email_idx").on(table.email)],
);

export const authSessions = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    impersonatedBy: text("impersonatedBy"),
    userId: text("userId")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("session_token_idx").on(table.token),
    index("session_user_id_idx").on(table.userId),
  ],
);

export const authAccounts = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: timestamp("accessTokenExpiresAt", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("account_user_id_idx").on(table.userId),
    index("account_provider_account_idx").on(table.providerId, table.accountId),
  ],
);

export const authVerifications = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    firstName: text("first_name"),
    lastName: text("last_name"),
    phone: text("phone"),
    birthDate: date("birth_date"),
    gender: text("gender"),
    interestedIn: text("interested_in"),
    discoverySource: text("discovery_source"),
    preferredDays: jsonb("preferred_days").$type<string[]>(),
    preferredTimes: jsonb("preferred_times").$type<string[]>(),
    emailNotifications: boolean("email_notifications").notNull().default(true),
    eventReminderNotifications: boolean("event_reminder_notifications").notNull().default(true),
    eventResultNotifications: boolean("event_result_notifications").notNull().default(true),
    locale: text("locale").notNull().default("pl"),
    marketingConsent: boolean("marketing_consent").notNull().default(false),
    newDateNotifications: boolean("new_date_notifications").notNull().default(true),
    eventCriteriaNotifications: boolean("event_criteria_notifications").notNull().default(true),
    onboardingStartedAt: timestamp("onboarding_started_at", { withTimezone: true }),
    onboardingCompletedAt: timestamp("onboarding_completed_at", { withTimezone: true }),
    onboardingSkippedAt: timestamp("onboarding_skipped_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("profiles_user_id_unique_idx").on(table.userId)],
);

export const venues = pgTable("venues", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  city: text("city").notNull().default("Gdansk"),
  district: text("district").notNull().default("Stare Miasto"),
  address: text("address").notNull(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  mapUrl: text("map_url"),
  capacity: integer("capacity").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    venueId: uuid("venue_id").references(() => venues.id, { onDelete: "set null" }),
    adminUserId: text("admin_user_id").references(() => authUsers.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    city: text("city").notNull().default("Gdansk"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    durationMinutes: integer("duration_minutes").notNull().default(120),
    conversationMinutes: integer("conversation_minutes").notNull().default(10),
    ageMin: integer("age_min").notNull().default(25),
    ageMax: integer("age_max").notNull().default(35),
    capacityTotal: integer("capacity_total").notNull(),
    femaleCapacity: integer("female_capacity").notNull().default(0),
    maleCapacity: integer("male_capacity").notNull().default(0),
    spotsAvailable: integer("spots_available").notNull(),
    femaleSpotsAvailable: integer("female_spots_available").notNull().default(0),
    maleSpotsAvailable: integer("male_spots_available").notNull().default(0),
    priceGroszy: integer("price_groszy").notNull(),
    currency: text("currency").notNull().default("PLN"),
    status: eventStatusEnum("status").notNull().default("draft"),
    badge: text("badge"),
    description: text("description"),
    imageSrc: text("image_src"),
    language: text("language").notNull().default("RU/PL"),
    organizerEmail: text("organizer_email"),
    organizerFirstName: text("organizer_first_name"),
    organizerImage: text("organizer_image"),
    organizerLastName: text("organizer_last_name"),
    organizerPhone: text("organizer_phone"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("events_slug_idx").on(table.slug),
    index("events_starts_at_idx").on(table.startsAt),
    index("events_status_idx").on(table.status),
  ],
);

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    attendeeNumber: integer("attendee_number"),
    status: bookingStatusEnum("status").notNull().default("pending"),
    stripeCheckoutSessionId: text("stripe_checkout_session_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("bookings_user_id_idx").on(table.userId),
    index("bookings_event_id_idx").on(table.eventId),
    uniqueIndex("bookings_event_attendee_number_unique_idx").on(
      table.eventId,
      table.attendeeNumber,
    ),
    uniqueIndex("bookings_user_event_unique_idx").on(table.userId, table.eventId),
  ],
);

export const eventLikes = pgTable(
  "event_likes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    fromBookingId: uuid("from_booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    toBookingId: uuid("to_booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    createdByAdminId: text("created_by_admin_id").references(() => authUsers.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("event_likes_event_id_idx").on(table.eventId),
    index("event_likes_from_booking_id_idx").on(table.fromBookingId),
    index("event_likes_to_booking_id_idx").on(table.toBookingId),
    uniqueIndex("event_likes_pair_unique_idx").on(table.fromBookingId, table.toBookingId),
  ],
);

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  amountGroszy: integer("amount_groszy").notNull(),
  currency: text("currency").notNull().default("PLN"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  provider: text("provider").notNull().default("stripe"),
  providerPaymentId: text("provider_payment_id"),
  paymentMethodType: text("payment_method_type"),
  stripeRefundId: text("stripe_refund_id"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  refundedAt: timestamp("refunded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const adminAuditLogs = pgTable(
  "admin_audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorUserId: text("actor_user_id").references(() => authUsers.id, { onDelete: "set null" }),
    actorEmail: text("actor_email"),
    actorName: text("actor_name"),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    summary: text("summary").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("admin_audit_logs_created_at_idx").on(table.createdAt),
    index("admin_audit_logs_actor_user_id_idx").on(table.actorUserId),
    index("admin_audit_logs_action_idx").on(table.action),
    index("admin_audit_logs_entity_idx").on(table.entityType, table.entityId),
  ],
);

export const emailEvents = pgTable("email_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => authUsers.id, { onDelete: "set null" }),
  template: text("template").notNull(),
  providerMessageId: text("provider_message_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const emailCampaigns = pgTable(
  "email_campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdByUserId: text("created_by_user_id").references(() => authUsers.id, {
      onDelete: "set null",
    }),
    type: text("type").notNull(),
    status: text("status").notNull().default("sending"),
    subject: text("subject").notNull(),
    summary: text("summary").notNull(),
    eventIds: jsonb("event_ids").$type<string[]>().notNull().default([]),
    recipientCount: integer("recipient_count").notNull().default(0),
    sentCount: integer("sent_count").notNull().default(0),
    skippedCount: integer("skipped_count").notNull().default(0),
    failedCount: integer("failed_count").notNull().default(0),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("email_campaigns_created_at_idx").on(table.createdAt),
    index("email_campaigns_type_status_idx").on(table.type, table.status),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    tone: text("tone").notNull().default("info"),
    title: text("title").notNull(),
    body: text("body").notNull(),
    actionUrl: text("action_url"),
    dedupeKey: text("dedupe_key"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("notifications_user_created_at_idx").on(table.userId, table.createdAt),
    index("notifications_user_read_at_idx").on(table.userId, table.readAt),
    uniqueIndex("notifications_user_dedupe_key_unique_idx").on(table.userId, table.dedupeKey),
  ],
);

export const newsletterSubscriptions = pgTable(
  "newsletter_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    firstName: text("first_name").notNull(),
    age: integer("age").notNull(),
    gender: text("gender").notNull(),
    locale: text("locale").notNull().default("pl"),
    source: text("source").notNull().default("home_waitlist"),
    marketingConsent: boolean("marketing_consent").notNull().default(true),
    subscribedAt: timestamp("subscribed_at", { withTimezone: true }).defaultNow().notNull(),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("newsletter_subscriptions_email_unique_idx").on(table.email),
    index("newsletter_subscriptions_marketing_idx").on(
      table.marketingConsent,
      table.unsubscribedAt,
    ),
  ],
);
