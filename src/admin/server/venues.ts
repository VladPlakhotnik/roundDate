import "server-only";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { asc, count, eq, ilike, inArray, or, type SQL } from "drizzle-orm";

import { requireAdmin } from "@/admin/auth/require-admin";
import { recordAdminAuditLog } from "@/admin/server/audit-logs";
import { getDb } from "@/shared/server/db/client";
import { events, venues } from "@/shared/server/db/schema";

export type AdminVenueFilters = {
  q: string;
};

export type AdminVenueListItem = {
  address: string;
  capacity: number;
  city: string;
  district: string;
  eventsCount: number;
  id: string;
  latitude: number | null;
  longitude: number | null;
  mapUrl: string | null;
  name: string;
  updatedAt: Date;
};

export type AdminVenuesPageData = {
  filters: AdminVenueFilters;
  total: number;
  venues: AdminVenueListItem[];
};

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

export function normalizeAdminVenueFilters(
  params: Record<string, string | string[] | undefined>,
): AdminVenueFilters {
  return {
    q: normalizeSearchQuery(getSingleParam(params.q)),
  };
}

function readString(formData: FormData, key: string, fallback = "") {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : fallback;
}

function readNumber(formData: FormData, key: string, fallback: number) {
  const value = Number(readString(formData, key));

  return Number.isFinite(value) ? value : fallback;
}

function readNullableNumber(formData: FormData, key: string) {
  const value = readString(formData, key);

  if (!value) {
    return null;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
}

function createVenueWhere(filters: AdminVenueFilters): SQL | undefined {
  if (!filters.q) {
    return undefined;
  }

  const like = `%${filters.q}%`;

  return or(
    ilike(venues.name, like),
    ilike(venues.address, like),
    ilike(venues.city, like),
    ilike(venues.district, like),
  );
}

async function getVenueEventCounts(venueIds: string[]) {
  if (venueIds.length === 0) {
    return new Map<string, number>();
  }

  const rows = await getDb()
    .select({
      eventCount: count(events.id),
      venueId: events.venueId,
    })
    .from(events)
    .where(inArray(events.venueId, venueIds))
    .groupBy(events.venueId);

  return new Map(
    rows
      .filter((row): row is { eventCount: number; venueId: string } => Boolean(row.venueId))
      .map((row) => [row.venueId, Number(row.eventCount)]),
  );
}

export async function getAdminVenuesPageData(
  filters: AdminVenueFilters = { q: "" },
): Promise<AdminVenuesPageData> {
  await requireAdmin();

  const db = getDb();
  const where = createVenueWhere(filters);
  const venuesQuery = db
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
    .from(venues);
  const totalQuery = db.select({ value: count() }).from(venues);

  const [venueRows, totalRows] = await Promise.all([
    (where ? venuesQuery.where(where) : venuesQuery).orderBy(asc(venues.name)),
    where ? totalQuery.where(where) : totalQuery,
  ]);
  const counts = await getVenueEventCounts(venueRows.map((venue) => venue.id));

  return {
    filters,
    total: Number(totalRows[0]?.value ?? 0),
    venues: venueRows.map((venue) => ({
      ...venue,
      eventsCount: counts.get(venue.id) ?? 0,
    })),
  };
}

export async function createAdminVenueAction(formData: FormData) {
  "use server";

  const admin = await requireAdmin();
  const venueId = randomUUID();
  const name = readString(formData, "name", "Новая площадка") || "Новая площадка";
  const city = readString(formData, "city", "Gdansk") || "Gdansk";
  const district = readString(formData, "district", "Stare Miasto") || "Stare Miasto";

  await getDb()
    .insert(venues)
    .values({
      id: venueId,
      address: readString(formData, "address", "Gdansk") || "Gdansk",
      capacity: Math.max(0, Math.round(readNumber(formData, "capacity", 16))),
      city,
      district,
      latitude: readNullableNumber(formData, "latitude"),
      longitude: readNullableNumber(formData, "longitude"),
      mapUrl: readString(formData, "mapUrl") || null,
      name,
    });

  await recordAdminAuditLog({
    action: "venue.created",
    actor: admin,
    entityId: venueId,
    entityType: "venue",
    metadata: { city, district },
    summary: `Создан адрес: ${name}`,
  });

  revalidatePath("/admin/addresses");
  revalidatePath("/admin/events");
}

export async function updateAdminVenueAction(formData: FormData) {
  "use server";

  const admin = await requireAdmin();

  const venueId = readString(formData, "venueId");

  if (!venueId) {
    revalidatePath("/admin/addresses");
    return;
  }

  const name = readString(formData, "name", "Площадка") || "Площадка";
  const city = readString(formData, "city", "Gdansk") || "Gdansk";
  const district = readString(formData, "district", "Stare Miasto") || "Stare Miasto";

  await getDb()
    .update(venues)
    .set({
      address: readString(formData, "address", "Gdansk") || "Gdansk",
      capacity: Math.max(0, Math.round(readNumber(formData, "capacity", 16))),
      city,
      district,
      latitude: readNullableNumber(formData, "latitude"),
      longitude: readNullableNumber(formData, "longitude"),
      mapUrl: readString(formData, "mapUrl") || null,
      name,
      updatedAt: new Date(),
    })
    .where(eq(venues.id, venueId));

  await recordAdminAuditLog({
    action: "venue.updated",
    actor: admin,
    entityId: venueId,
    entityType: "venue",
    metadata: { city, district },
    summary: `Обновлен адрес: ${name}`,
  });

  revalidatePath("/admin/addresses");
  revalidatePath("/admin/events");
  revalidatePath("/profile/events");
  revalidatePath("/");
}

export async function deleteAdminVenueAction(formData: FormData) {
  "use server";

  const admin = await requireAdmin();

  const venueId = readString(formData, "venueId");

  if (!venueId) {
    revalidatePath("/admin/addresses");
    return;
  }

  const db = getDb();
  const [venue] = await db
    .select({
      name: venues.name,
    })
    .from(venues)
    .where(eq(venues.id, venueId))
    .limit(1);

  await db.delete(venues).where(eq(venues.id, venueId));

  await recordAdminAuditLog({
    action: "venue.deleted",
    actor: admin,
    entityId: venueId,
    entityType: "venue",
    summary: `Удален адрес: ${venue?.name ?? venueId}`,
  });

  revalidatePath("/admin/addresses");
  revalidatePath("/admin/events");
  revalidatePath("/profile/events");
  revalidatePath("/");
}
