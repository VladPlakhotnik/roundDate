import {
  boolean,
  date,
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

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "cancelled",
  "attended",
  "no_show",
]);
export const eventStatusEnum = pgEnum("event_status", [
  "draft",
  "published",
  "sold_out",
  "finished",
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
  address: text("address").notNull(),
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
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    city: text("city").notNull().default("Gdansk"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    durationMinutes: integer("duration_minutes").notNull().default(120),
    conversationMinutes: integer("conversation_minutes").notNull().default(10),
    capacityTotal: integer("capacity_total").notNull(),
    spotsAvailable: integer("spots_available").notNull(),
    priceGroszy: integer("price_groszy").notNull(),
    currency: text("currency").notNull().default("PLN"),
    status: eventStatusEnum("status").notNull().default("draft"),
    description: text("description"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("events_slug_idx").on(table.slug),
    index("events_starts_at_idx").on(table.startsAt),
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
    status: bookingStatusEnum("status").notNull().default("pending"),
    stripeCheckoutSessionId: text("stripe_checkout_session_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("bookings_user_id_idx").on(table.userId),
    index("bookings_event_id_idx").on(table.eventId),
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
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const emailEvents = pgTable("email_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => authUsers.id, { onDelete: "set null" }),
  template: text("template").notNull(),
  providerMessageId: text("provider_message_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
