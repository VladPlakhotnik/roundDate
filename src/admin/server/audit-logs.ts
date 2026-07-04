import "server-only";

import { revalidatePath } from "next/cache";
import { and, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";

import { requireAdmin } from "@/admin/auth/require-admin";
import { getDb } from "@/shared/server/db/client";
import { adminAuditLogs } from "@/shared/server/db/schema";

export type AdminAuditLogFilters = {
  action: string;
  entity: string;
  q: string;
};

export type AdminAuditLogItem = {
  action: string;
  actorEmail: string | null;
  actorName: string | null;
  actorUserId: string | null;
  createdAt: Date;
  entityId: string | null;
  entityType: string;
  id: string;
  metadata: Record<string, unknown> | null;
  summary: string;
};

export type AdminAuditLogsPageData = {
  filters: AdminAuditLogFilters;
  logs: AdminAuditLogItem[];
  total: number;
};

type AuditLogActor = {
  email: string;
  id: string;
  name: string;
};

type RecordAdminAuditLogInput = {
  action: string;
  actor?: AuditLogActor;
  entityId?: string | null;
  entityType: string;
  metadata?: Record<string, unknown> | null;
  summary: string;
};

const sensitiveMetadataKeys = new Set([
  "apikey",
  "authorization",
  "cookie",
  "password",
  "secret",
  "session",
  "token",
]);

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

function normalizeFilterValue(value: string, fallback = "all") {
  const normalizedValue = value.trim().slice(0, 80);

  return normalizedValue || fallback;
}

function normalizeMetadataKey(key: string) {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isSensitiveMetadataKey(key: string) {
  const normalizedKey = normalizeMetadataKey(key);

  return [...sensitiveMetadataKeys].some((sensitiveKey) => normalizedKey.includes(sensitiveKey));
}

function sanitizeAuditLogValue(value: unknown, depth: number): unknown {
  if (value === null || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.length > 500 ? `${value.slice(0, 497)}...` : value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    if (depth >= 3) {
      return "[array]";
    }

    return value.slice(0, 20).map((item) => sanitizeAuditLogValue(item, depth + 1));
  }

  if (typeof value === "object") {
    if (depth >= 3) {
      return "[object]";
    }

    return sanitizeAuditLogMetadata(value as Record<string, unknown>, depth + 1);
  }

  return String(value);
}

export function sanitizeAuditLogMetadata(
  metadata: Record<string, unknown> | null | undefined,
  depth = 0,
) {
  if (!metadata) {
    return null;
  }

  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([key]) => !isSensitiveMetadataKey(key))
      .slice(0, 40)
      .map(([key, value]) => [key, sanitizeAuditLogValue(value, depth)]),
  );
}

export function normalizeAdminAuditLogFilters(
  params: Record<string, string | string[] | undefined>,
): AdminAuditLogFilters {
  return {
    action: normalizeFilterValue(getSingleParam(params.action)),
    entity: normalizeFilterValue(getSingleParam(params.entity)),
    q: normalizeSearchQuery(getSingleParam(params.q)),
  };
}

function createAuditLogsWhere(filters: AdminAuditLogFilters): SQL | undefined {
  const clauses: SQL[] = [];

  if (filters.action !== "all") {
    clauses.push(eq(adminAuditLogs.action, filters.action));
  }

  if (filters.entity !== "all") {
    clauses.push(eq(adminAuditLogs.entityType, filters.entity));
  }

  if (filters.q) {
    const like = `%${filters.q}%`;
    const searchClause = or(
      ilike(adminAuditLogs.summary, like),
      ilike(adminAuditLogs.actorEmail, like),
      ilike(adminAuditLogs.actorName, like),
      ilike(adminAuditLogs.action, like),
      ilike(adminAuditLogs.entityType, like),
      ilike(adminAuditLogs.entityId, like),
    );

    if (searchClause) {
      clauses.push(searchClause);
    }
  }

  return clauses.length > 0 ? and(...clauses) : undefined;
}

export async function getAdminAuditLogsPageData(
  filters: AdminAuditLogFilters,
): Promise<AdminAuditLogsPageData> {
  await requireAdmin();
  const db = getDb();
  const where = createAuditLogsWhere(filters);
  const logsQuery = db
    .select({
      action: adminAuditLogs.action,
      actorEmail: adminAuditLogs.actorEmail,
      actorName: adminAuditLogs.actorName,
      actorUserId: adminAuditLogs.actorUserId,
      createdAt: adminAuditLogs.createdAt,
      entityId: adminAuditLogs.entityId,
      entityType: adminAuditLogs.entityType,
      id: adminAuditLogs.id,
      metadata: adminAuditLogs.metadata,
      summary: adminAuditLogs.summary,
    })
    .from(adminAuditLogs);
  const totalQuery = db.select({ value: count() }).from(adminAuditLogs);
  const [logs, totalRows] = await Promise.all([
    (where ? logsQuery.where(where) : logsQuery).orderBy(desc(adminAuditLogs.createdAt)).limit(80),
    where ? totalQuery.where(where) : totalQuery,
  ]);

  return {
    filters,
    logs,
    total: Number(totalRows[0]?.value ?? 0),
  };
}

export async function recordAdminAuditLog(input: RecordAdminAuditLogInput) {
  const actor = input.actor ?? (await requireAdmin());

  try {
    await getDb()
      .insert(adminAuditLogs)
      .values({
        action: input.action,
        actorEmail: actor.email,
        actorName: actor.name,
        actorUserId: actor.id,
        entityId: input.entityId ?? null,
        entityType: input.entityType,
        metadata: sanitizeAuditLogMetadata(input.metadata),
        summary: input.summary,
      });

    revalidatePath("/admin");
    revalidatePath("/admin/logs");
  } catch (error) {
    console.error("Failed to record admin audit log", error);
  }
}
