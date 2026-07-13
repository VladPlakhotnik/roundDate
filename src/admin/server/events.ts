import "server-only";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { and, asc, desc, eq, ilike, inArray, or, type SQL } from "drizzle-orm";

import { requireAdmin } from "@/admin/auth/require-admin";
import { recordAdminAuditLog } from "@/admin/server/audit-logs";
import {
  getEventPublishState,
  shouldPublishScheduledEvent,
  type EventPublishState,
} from "@/admin/server/event-workflow";
import { getDb } from "@/shared/server/db/client";
import { authUsers, events, profiles, venues } from "@/shared/server/db/schema";
import type { EventStatus } from "@/shared/types";
import type { AdminVenueListItem } from "./venues";

export type AdminEventListItem = {
  adminUserId: string | null;
  ageMax: number;
  ageMin: number;
  badge: string | null;
  capacityTotal: number;
  city: string;
  conversationMinutes: number;
  currency: string;
  description: string | null;
  durationMinutes: number;
  femaleCapacity: number;
  femaleSpotsAvailable: number;
  id: string;
  imageSrc: string | null;
  language: string;
  maleCapacity: number;
  maleSpotsAvailable: number;
  metadata: Record<string, unknown> | null;
  organizerEmail: string | null;
  organizerFirstName: string | null;
  organizerImage: string | null;
  organizerLastName: string | null;
  organizerPhone: string | null;
  priceGroszy: number;
  publishState: EventPublishState;
  slug: string;
  spotsAvailable: number;
  startsAt: Date;
  status: EventStatus;
  title: string;
  venueId: string | null;
  venueAddress: string | null;
  venueDistrict: string | null;
  venueLatitude: number | null;
  venueLongitude: number | null;
  venueName: string | null;
};

export type AdminEventOwner = {
  email: string;
  firstName: string | null;
  id: string;
  image: string | null;
  lastName: string | null;
  name: string;
  phone: string | null;
};

export type AdminEventStatusFilter = EventStatus | "all";

export type AdminEventFilters = {
  q: string;
  status: AdminEventStatusFilter;
};

export type AdminEventsPageData = {
  admins: AdminEventOwner[];
  currentAdminId: string;
  filters: AdminEventFilters;
  events: AdminEventListItem[];
  venues: AdminVenueListItem[];
};

const eventStatuses = new Set<EventStatus>([
  "cancelled",
  "draft",
  "finished",
  "published",
  "sold_out",
]);
const eventStatusFilters = new Set<AdminEventStatusFilter>(["all", ...eventStatuses]);
const adminOwnerRoles = ["admin", "manager"] as const;

function getSingleParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function normalizeSearchQuery(value: string) {
  const query = value.trim().slice(0, 120);

  return query.length >= 2 ? query : "";
}

export function normalizeAdminEventFilters(
  params: Record<string, string | string[] | undefined>,
): AdminEventFilters {
  const status = getSingleParam(params.status);

  return {
    q: normalizeSearchQuery(getSingleParam(params.q)),
    status: eventStatusFilters.has(status as AdminEventStatusFilter)
      ? (status as AdminEventStatusFilter)
      : "all",
  };
}

function createEventsWhere(filters: AdminEventFilters): SQL | undefined {
  const clauses: SQL[] = [];

  if (filters.q) {
    const like = `%${filters.q}%`;
    const searchClause = or(
      ilike(events.title, like),
      ilike(events.slug, like),
      ilike(events.city, like),
      ilike(venues.name, like),
      ilike(venues.address, like),
      ilike(venues.district, like),
    );

    if (searchClause) {
      clauses.push(searchClause);
    }
  }

  if (filters.status !== "all") {
    clauses.push(eq(events.status, filters.status));
  }

  return clauses.length > 0 ? and(...clauses) : undefined;
}

function readString(formData: FormData, key: string, fallback = "") {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : fallback;
}

function readNumber(formData: FormData, key: string, fallback: number) {
  const value = Number(readString(formData, key));

  return Number.isFinite(value) ? value : fallback;
}

function readStatus(formData: FormData): EventStatus {
  const value = readString(formData, "status", "draft");

  return eventStatuses.has(value as EventStatus) ? (value as EventStatus) : "draft";
}

function getDateTime(formData: FormData) {
  return getDateTimeFromKeys(formData, "date", "time");
}

function getDateTimeFromKeys(formData: FormData, dateKey: string, timeKey: string) {
  const date = readString(formData, dateKey);
  const time = readString(formData, timeKey, "19:00");
  const fallback = new Date();

  fallback.setDate(fallback.getDate() + 14);
  fallback.setHours(19, 0, 0, 0);

  if (!date) {
    return fallback;
  }

  const startsAt = new Date(`${date}T${time}:00+02:00`);

  return Number.isNaN(startsAt.getTime()) ? fallback : startsAt;
}

function createSlug(title: string, startsAt: Date) {
  const datePart = startsAt.toISOString().slice(0, 10);
  const base =
    title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "event";

  return `${base}-${datePart}-${randomUUID().slice(0, 8)}`;
}

function getDisplayName(user: AdminEventOwner) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.name || user.email;
}

function withoutPublishAt(metadata: Record<string, unknown> | null | undefined) {
  const nextMetadata = { ...(metadata ?? {}) };

  delete nextMetadata.publishAt;

  return nextMetadata;
}

function getPublicationFields(
  formData: FormData,
  currentMetadata?: Record<string, unknown> | null,
): { metadata: Record<string, unknown>; status: EventStatus } {
  const requestedStatus = readStatus(formData);
  const publicationMode = readString(
    formData,
    "publicationMode",
    requestedStatus === "published" ? "now" : "draft",
  );

  if (publicationMode === "scheduled") {
    const publishAt = getDateTimeFromKeys(formData, "publishDate", "publishTime");

    return {
      metadata: {
        ...withoutPublishAt(currentMetadata),
        publishAt: publishAt.toISOString(),
      },
      status: "draft",
    };
  }

  if (publicationMode === "now" || requestedStatus === "published") {
    return {
      metadata: {
        ...withoutPublishAt(currentMetadata),
        publishedAt: new Date().toISOString(),
      },
      status: "published",
    };
  }

  return {
    metadata: withoutPublishAt(currentMetadata),
    status: requestedStatus,
  };
}

async function publishDueAdminEvents() {
  const db = getDb();
  const draftRows = await db
    .select({
      id: events.id,
      metadata: events.metadata,
      status: events.status,
    })
    .from(events)
    .where(eq(events.status, "draft"));
  const dueRows = draftRows.filter((row) =>
    shouldPublishScheduledEvent({
      metadata: row.metadata,
      status: row.status,
    }),
  );

  await Promise.all(
    dueRows.map((row) =>
      db
        .update(events)
        .set({
          metadata: {
            ...withoutPublishAt(row.metadata),
            publishedAt: new Date().toISOString(),
          },
          status: "published",
          updatedAt: new Date(),
        })
        .where(eq(events.id, row.id)),
    ),
  );
}

async function getOrCreateVenue(input: {
  address: string;
  capacity: number;
  city: string;
  district: string;
  latitude: number;
  longitude: number;
  name: string;
  venueId: string;
}) {
  const db = getDb();

  if (input.venueId) {
    const [existingVenue] = await db
      .select({
        city: venues.city,
        id: venues.id,
      })
      .from(venues)
      .where(eq(venues.id, input.venueId))
      .limit(1);

    if (existingVenue) {
      return existingVenue;
    }
  }

  const [matchingVenue] = await db
    .select({
      city: venues.city,
      id: venues.id,
    })
    .from(venues)
    .where(
      and(
        eq(venues.name, input.name),
        eq(venues.address, input.address),
        eq(venues.city, input.city),
      ),
    )
    .limit(1);

  if (matchingVenue) {
    return matchingVenue;
  }

  const [venue] = await db
    .insert(venues)
    .values({
      address: input.address,
      capacity: input.capacity,
      city: input.city,
      district: input.district,
      latitude: input.latitude,
      longitude: input.longitude,
      name: input.name,
    })
    .returning({ city: venues.city, id: venues.id });

  return venue;
}

export async function getAdminEventsPageData(
  filters: AdminEventFilters = { q: "", status: "all" },
): Promise<AdminEventsPageData> {
  const admin = await requireAdmin();
  const db = getDb();
  const where = createEventsWhere(filters);

  await publishDueAdminEvents();

  const eventsQuery = db
    .select({
      adminUserId: events.adminUserId,
      ageMax: events.ageMax,
      ageMin: events.ageMin,
      badge: events.badge,
      capacityTotal: events.capacityTotal,
      city: events.city,
      conversationMinutes: events.conversationMinutes,
      currency: events.currency,
      description: events.description,
      durationMinutes: events.durationMinutes,
      femaleCapacity: events.femaleCapacity,
      femaleSpotsAvailable: events.femaleSpotsAvailable,
      id: events.id,
      imageSrc: events.imageSrc,
      language: events.language,
      maleCapacity: events.maleCapacity,
      maleSpotsAvailable: events.maleSpotsAvailable,
      metadata: events.metadata,
      organizerEmail: events.organizerEmail,
      organizerFirstName: events.organizerFirstName,
      organizerImage: events.organizerImage,
      organizerLastName: events.organizerLastName,
      organizerPhone: events.organizerPhone,
      priceGroszy: events.priceGroszy,
      slug: events.slug,
      spotsAvailable: events.spotsAvailable,
      startsAt: events.startsAt,
      status: events.status,
      title: events.title,
      venueId: events.venueId,
      venueAddress: venues.address,
      venueDistrict: venues.district,
      venueLatitude: venues.latitude,
      venueLongitude: venues.longitude,
      venueName: venues.name,
    })
    .from(events)
    .leftJoin(venues, eq(events.venueId, venues.id));
  const [eventRows, adminRows, venueRows] = await Promise.all([
    (where ? eventsQuery.where(where) : eventsQuery).orderBy(desc(events.startsAt)),
    db
      .select({
        email: authUsers.email,
        firstName: profiles.firstName,
        id: authUsers.id,
        image: authUsers.image,
        lastName: profiles.lastName,
        name: authUsers.name,
        phone: profiles.phone,
      })
      .from(authUsers)
      .leftJoin(profiles, eq(profiles.userId, authUsers.id))
      .where(and(inArray(authUsers.role, adminOwnerRoles), eq(authUsers.banned, false)))
      .orderBy(asc(authUsers.name)),
    db
      .select({
        address: venues.address,
        capacity: venues.capacity,
        city: venues.city,
        district: venues.district,
        id: venues.id,
        latitude: venues.latitude,
        longitude: venues.longitude,
        mapUrl: venues.mapUrl,
        name: venues.name,
        updatedAt: venues.updatedAt,
      })
      .from(venues)
      .orderBy(asc(venues.name)),
  ]);

  const currentAdminFallback: AdminEventOwner = {
    email: admin.email,
    firstName: null,
    id: admin.id,
    image: admin.image,
    lastName: null,
    name: admin.name,
    phone: null,
  };
  const admins = adminRows.length > 0 ? adminRows : [currentAdminFallback];

  return {
    admins,
    currentAdminId: admin.id,
    filters,
    events: eventRows.map((event) => ({
      ...event,
      publishState: getEventPublishState({
        metadata: event.metadata,
        status: event.status,
      }),
    })),
    venues: venueRows.map((venue) => ({ ...venue, eventsCount: 0 })),
  };
}

export async function createAdminEventAction(formData: FormData) {
  "use server";

  const admin = await requireAdmin();
  const db = getDb();
  const title = readString(formData, "title", "RoundDate");
  const startsAt = getDateTime(formData);
  const femaleCapacity = Math.max(0, Math.round(readNumber(formData, "femaleCapacity", 8)));
  const maleCapacity = Math.max(0, Math.round(readNumber(formData, "maleCapacity", 8)));
  const capacityTotal = femaleCapacity + maleCapacity;
  const adminUserId = readString(formData, "adminUserId", admin.id) || admin.id;
  const [assignedAdmin] = await db
    .select({
      email: authUsers.email,
      firstName: profiles.firstName,
      id: authUsers.id,
      image: authUsers.image,
      lastName: profiles.lastName,
      name: authUsers.name,
      phone: profiles.phone,
    })
    .from(authUsers)
    .leftJoin(profiles, eq(profiles.userId, authUsers.id))
    .where(and(eq(authUsers.id, adminUserId), inArray(authUsers.role, adminOwnerRoles)))
    .limit(1);
  const owner = assignedAdmin ?? {
    email: admin.email,
    firstName: null,
    id: admin.id,
    image: admin.image,
    lastName: null,
    name: admin.name,
    phone: null,
  };
  const city = readString(formData, "city", "Gdansk") || "Gdansk";
  const venueId = readString(formData, "venueId");
  const venueName = readString(formData, "venueName", "Kameralna sala") || "Kameralna sala";
  const address = readString(formData, "venueAddress", "Gdansk") || "Gdansk";
  const district = readString(formData, "district", "Stare Miasto") || "Stare Miasto";
  const latitude = readNumber(formData, "latitude", 54.3464);
  const longitude = readNumber(formData, "longitude", 18.6533);
  const venue = await getOrCreateVenue({
    address,
    capacity: capacityTotal,
    city,
    district,
    latitude,
    longitude,
    name: venueName,
    venueId,
  });
  const eventCity = venue?.city ?? city;
  const publication = getPublicationFields(formData);
  const eventId = randomUUID();

  await db.insert(events).values({
    id: eventId,
    adminUserId: owner.id,
    ageMax: Math.round(readNumber(formData, "ageMax", 35)),
    ageMin: Math.round(readNumber(formData, "ageMin", 25)),
    badge: readString(formData, "badge", "Идет набор") || "Идет набор",
    capacityTotal,
    city: eventCity,
    conversationMinutes: Math.round(readNumber(formData, "conversationMinutes", 10)),
    currency: "PLN",
    description: readString(formData, "description"),
    durationMinutes: Math.round(readNumber(formData, "durationMinutes", 120)),
    femaleCapacity,
    femaleSpotsAvailable: femaleCapacity,
    imageSrc: readString(formData, "coverSrc", "/assets/home-events/chairs-date.png"),
    language: readString(formData, "language", "RU/PL") || "RU/PL",
    maleCapacity,
    maleSpotsAvailable: maleCapacity,
    metadata: {
      ...publication.metadata,
      addressMode: readString(formData, "addressMode", "manual"),
      createdFrom: "admin",
      highlights: [
        `${readNumber(formData, "conversationMinutes", 10)}-minutowe rundy`,
        "Równowaga uczestników",
        "Kontakty po wzajemnym polubieniu",
      ],
      latitude,
      longitude,
    },
    organizerEmail: owner.email,
    organizerFirstName: owner.firstName ?? getDisplayName(owner).split(" ")[0] ?? owner.name,
    organizerImage: owner.image,
    organizerLastName: owner.lastName ?? getDisplayName(owner).split(" ").slice(1).join(" "),
    organizerPhone: owner.phone,
    priceGroszy: Math.round(readNumber(formData, "price", 129) * 100),
    slug: createSlug(title, startsAt),
    spotsAvailable: capacityTotal,
    startsAt,
    status: publication.status,
    title,
    venueId: venue?.id,
  });

  await recordAdminAuditLog({
    action: "event.created",
    actor: admin,
    entityId: eventId,
    entityType: "event",
    metadata: {
      capacityTotal,
      startsAt,
      status: publication.status,
      venueId: venue?.id ?? null,
    },
    summary: `Создано мероприятие: ${title}`,
  });

  revalidatePath("/admin/events");
  revalidatePath("/admin/addresses");
  revalidatePath("/profile/events");
  revalidatePath("/");
}

export async function publishAdminEventAction(formData: FormData) {
  "use server";

  const admin = await requireAdmin();
  const db = getDb();
  const eventId = readString(formData, "eventId");

  if (!eventId) {
    return;
  }

  const [event] = await db
    .select({
      id: events.id,
      metadata: events.metadata,
      status: events.status,
      title: events.title,
    })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event || event.status !== "draft") {
    return;
  }

  const publication = getPublicationFields(formData, event.metadata);

  await db
    .update(events)
    .set({
      metadata: publication.metadata,
      status: publication.status,
      updatedAt: new Date(),
    })
    .where(eq(events.id, eventId));

  await recordAdminAuditLog({
    action: "event.published",
    actor: admin,
    entityId: eventId,
    entityType: "event",
    metadata: {
      previousStatus: event.status,
      status: publication.status,
    },
    summary: `Опубликовано мероприятие: ${event.title}`,
  });

  revalidatePath("/admin/events");
  revalidatePath("/profile/events");
  revalidatePath("/");
}

export async function updateAdminEventAction(formData: FormData) {
  "use server";

  const admin = await requireAdmin();
  const db = getDb();
  const eventId = readString(formData, "eventId");

  if (!eventId) {
    return;
  }

  const [event] = await db
    .select({
      metadata: events.metadata,
      slug: events.slug,
    })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event) {
    return;
  }

  const title = readString(formData, "title", "RoundDate");
  const startsAt = getDateTime(formData);
  const femaleCapacity = Math.max(0, Math.round(readNumber(formData, "femaleCapacity", 8)));
  const maleCapacity = Math.max(0, Math.round(readNumber(formData, "maleCapacity", 8)));
  const capacityTotal = femaleCapacity + maleCapacity;
  const city = readString(formData, "city", "Gdansk") || "Gdansk";
  const venueId = readString(formData, "venueId");
  const venueName = readString(formData, "venueName", "Kameralna sala") || "Kameralna sala";
  const address = readString(formData, "venueAddress", "Gdansk") || "Gdansk";
  const district = readString(formData, "district", "Stare Miasto") || "Stare Miasto";
  const latitude = readNumber(formData, "latitude", 54.3464);
  const longitude = readNumber(formData, "longitude", 18.6533);
  const adminUserId = readString(formData, "adminUserId", admin.id) || admin.id;
  const [assignedAdmin] = await db
    .select({
      email: authUsers.email,
      firstName: profiles.firstName,
      id: authUsers.id,
      image: authUsers.image,
      lastName: profiles.lastName,
      name: authUsers.name,
      phone: profiles.phone,
    })
    .from(authUsers)
    .leftJoin(profiles, eq(profiles.userId, authUsers.id))
    .where(and(eq(authUsers.id, adminUserId), inArray(authUsers.role, adminOwnerRoles)))
    .limit(1);
  const owner = assignedAdmin ?? {
    email: admin.email,
    firstName: null,
    id: admin.id,
    image: admin.image,
    lastName: null,
    name: admin.name,
    phone: null,
  };
  const venue = await getOrCreateVenue({
    address,
    capacity: capacityTotal,
    city,
    district,
    latitude,
    longitude,
    name: venueName,
    venueId,
  });
  const eventCity = venue?.city ?? city;
  const publication = getPublicationFields(formData, event.metadata);
  const metadata = {
    ...publication.metadata,
    addressMode: readString(formData, "addressMode", "manual"),
    latitude,
    longitude,
  };

  await db
    .update(events)
    .set({
      adminUserId: owner.id,
      ageMax: Math.round(readNumber(formData, "ageMax", 35)),
      ageMin: Math.round(readNumber(formData, "ageMin", 25)),
      badge: readString(formData, "badge", "Идет набор") || "Идет набор",
      capacityTotal,
      city: eventCity,
      conversationMinutes: Math.round(readNumber(formData, "conversationMinutes", 10)),
      description: readString(formData, "description"),
      durationMinutes: Math.round(readNumber(formData, "durationMinutes", 120)),
      femaleCapacity,
      femaleSpotsAvailable: Math.min(
        femaleCapacity,
        Math.max(0, Math.round(readNumber(formData, "femaleSpotsAvailable", femaleCapacity))),
      ),
      imageSrc: readString(formData, "coverSrc"),
      language: readString(formData, "language", "RU/PL") || "RU/PL",
      maleCapacity,
      maleSpotsAvailable: Math.min(
        maleCapacity,
        Math.max(0, Math.round(readNumber(formData, "maleSpotsAvailable", maleCapacity))),
      ),
      metadata,
      organizerEmail: owner.email,
      organizerFirstName: owner.firstName ?? getDisplayName(owner).split(" ")[0] ?? owner.name,
      organizerImage: owner.image,
      organizerLastName: owner.lastName ?? getDisplayName(owner).split(" ").slice(1).join(" "),
      organizerPhone: owner.phone,
      priceGroszy: Math.round(readNumber(formData, "price", 129) * 100),
      spotsAvailable: Math.min(
        capacityTotal,
        Math.max(0, Math.round(readNumber(formData, "spotsAvailable", capacityTotal))),
      ),
      startsAt,
      status: publication.status,
      title,
      updatedAt: new Date(),
      venueId: venue?.id,
    })
    .where(eq(events.id, eventId));

  await recordAdminAuditLog({
    action: "event.updated",
    actor: admin,
    entityId: eventId,
    entityType: "event",
    metadata: {
      capacityTotal,
      startsAt,
      status: publication.status,
      venueId: venue?.id ?? null,
    },
    summary: `Обновлено мероприятие: ${title}`,
  });

  revalidatePath("/admin/events");
  revalidatePath("/admin/addresses");
  revalidatePath("/profile/events");
  revalidatePath("/");
}

export async function deleteAdminEventAction(formData: FormData) {
  "use server";

  const admin = await requireAdmin();
  const db = getDb();
  const eventId = readString(formData, "eventId");

  if (!eventId) {
    return;
  }

  const [event] = await db
    .select({
      title: events.title,
    })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  await db.delete(events).where(eq(events.id, eventId));

  await recordAdminAuditLog({
    action: "event.deleted",
    actor: admin,
    entityId: eventId,
    entityType: "event",
    summary: `Удалено мероприятие: ${event?.title ?? eventId}`,
  });

  revalidatePath("/admin/events");
  revalidatePath("/profile/events");
  revalidatePath("/");
}
