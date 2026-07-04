import "server-only";

import { and, count, desc, eq, gt, gte, inArray, lt } from "drizzle-orm";

import { onboardingDiscoverySourceOptions } from "@/entities/profile/model/onboarding";
import { getDb } from "@/shared/server/db/client";
import {
  adminAuditLogs,
  authUsers,
  bookings,
  events,
  payments,
  profiles,
} from "@/shared/server/db/schema";

export type AdminChartPoint = {
  current: number;
  currentTotal?: number;
  label: string;
  previous: number;
  previousTotal?: number;
};

export type AdminDiscoverySourcePoint = {
  color: string;
  count: number;
  label: string;
  percentage: number;
  source: string;
};

export type AdminDiscoverySourceStats = {
  data: AdminDiscoverySourcePoint[];
  period: AdminDiscoverySourcePeriod;
  total: number;
};

export type AdminRecentDiscoverySourceUser = {
  createdAt: Date;
  email: string;
  id: string;
  name: string;
  source: string;
  sourceLabel: string;
};

export type AdminDiscoverySourcePeriod = "all" | "month" | "today" | "week";

export type AdminDashboardAuditLogItem = {
  action: string;
  actorEmail: string | null;
  actorName: string | null;
  createdAt: Date;
  entityId: string | null;
  entityType: string;
  id: string;
  summary: string;
};

export type AdminDashboardData = {
  activeEvents: number;
  discoverySourceChart: AdminDiscoverySourcePoint[];
  discoverySourcePeriod: AdminDiscoverySourcePeriod;
  discoverySourceTotal: number;
  latestAuditLogs: AdminDashboardAuditLogItem[];
  monthlyRevenueGroszy: number;
  newUsersThisMonth: number;
  paymentChart: AdminChartPoint[];
  pendingPaymentBookings: number;
  totalUsers: number;
  userChart: AdminChartPoint[];
};

type DiscoverySourceCountRow = {
  source: string | null;
  value: bigint | number | string;
};

const unknownDiscoverySource = "unknown";
const discoverySourceLabels: ReadonlyMap<string, string> = new Map(
  onboardingDiscoverySourceOptions.map((option) => [option.value, option.label]),
);
const discoverySourceColors: Record<string, string> = {
  facebook: "#2563eb",
  friend: "#16a34a",
  google: "#d97706",
  instagram: "#f04438",
  other: "#64748b",
  poster: "#7c3aed",
  tiktok: "#111827",
  unknown: "#94a3b8",
  venue: "#0f766e",
};
const discoverySourcePeriods = new Set<AdminDiscoverySourcePeriod>([
  "all",
  "today",
  "week",
  "month",
]);

export const adminDiscoverySourcePeriodOptions: Array<{
  label: string;
  value: AdminDiscoverySourcePeriod;
}> = [
  { label: "Все время", value: "all" },
  { label: "Сегодня", value: "today" },
  { label: "7 дней", value: "week" },
  { label: "30 дней", value: "month" },
];

function getMonthStart(date: Date, offset = 0) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

export function normalizeAdminDiscoverySourcePeriod(
  period: string | null | undefined,
): AdminDiscoverySourcePeriod {
  return discoverySourcePeriods.has(period as AdminDiscoverySourcePeriod)
    ? (period as AdminDiscoverySourcePeriod)
    : "all";
}

export function getDiscoverySourcePeriodStart(
  period: AdminDiscoverySourcePeriod,
  now = new Date(),
) {
  if (period === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  if (period === "week") {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  if (period === "month") {
    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return null;
}

function getDaysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function getDayKey(date: Date) {
  return date.getDate();
}

function createMonthSeries(input: {
  currentDays: number;
  currentMap: Map<number, number>;
  previousDays: number;
  previousMap: Map<number, number>;
  currentBaseTotal?: number;
  previousBaseTotal?: number;
}) {
  const days = Math.max(input.currentDays, input.previousDays);
  let currentTotal = input.currentBaseTotal ?? 0;
  let previousTotal = input.previousBaseTotal ?? 0;

  return Array.from({ length: days }, (_, index) => {
    const day = index + 1;
    const current = input.currentMap.get(day) ?? 0;
    const previous = input.previousMap.get(day) ?? 0;
    currentTotal += current;
    previousTotal += previous;

    return {
      current,
      currentTotal,
      label: String(day),
      previous,
      previousTotal,
    };
  });
}

function getDiscoverySourceKey(source: string | null) {
  const normalizedSource = source?.trim();

  return normalizedSource || unknownDiscoverySource;
}

export function getDiscoverySourceLabel(source: string | null) {
  const key = getDiscoverySourceKey(source);

  if (key === unknownDiscoverySource) {
    return "Не указано";
  }

  return discoverySourceLabels.get(key) ?? key;
}

function getDiscoverySourceColor(source: string) {
  return discoverySourceColors[source] ?? discoverySourceColors.other ?? "#64748b";
}

export function createDiscoverySourceDistribution(
  rows: DiscoverySourceCountRow[],
): AdminDiscoverySourcePoint[] {
  const normalizedRows = rows
    .map((row) => ({
      count: Number(row.value),
      source: getDiscoverySourceKey(row.source),
    }))
    .filter((row) => row.count > 0);
  const total = normalizedRows.reduce((sum, row) => sum + row.count, 0);

  return normalizedRows
    .map((row) => ({
      color: getDiscoverySourceColor(row.source),
      count: row.count,
      label: getDiscoverySourceLabel(row.source),
      percentage: total > 0 ? Math.round((row.count / total) * 1000) / 10 : 0,
      source: row.source,
    }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

export async function getAdminDiscoverySourceStats(
  period: AdminDiscoverySourcePeriod = "all",
): Promise<AdminDiscoverySourceStats> {
  const db = getDb();
  const periodStart = getDiscoverySourcePeriodStart(period);
  const rows = await db
    .select({ source: profiles.discoverySource, value: count() })
    .from(authUsers)
    .leftJoin(profiles, eq(profiles.userId, authUsers.id))
    .where(periodStart ? gte(authUsers.createdAt, periodStart) : undefined)
    .groupBy(profiles.discoverySource);
  const data = createDiscoverySourceDistribution(rows);

  return {
    data,
    period,
    total: data.reduce((sum, source) => sum + source.count, 0),
  };
}

function emptyDashboardData(
  now = new Date(),
  discoverySourcePeriod: AdminDiscoverySourcePeriod = "all",
): AdminDashboardData {
  const currentDays = getDaysInMonth(now);
  const previousDays = getDaysInMonth(getMonthStart(now, -1));
  const emptySeries = createMonthSeries({
    currentDays,
    currentMap: new Map(),
    previousDays,
    previousMap: new Map(),
  });

  return {
    activeEvents: 0,
    discoverySourceChart: [],
    discoverySourcePeriod,
    discoverySourceTotal: 0,
    latestAuditLogs: [],
    monthlyRevenueGroszy: 0,
    newUsersThisMonth: 0,
    paymentChart: emptySeries,
    pendingPaymentBookings: 0,
    totalUsers: 0,
    userChart: emptySeries,
  };
}

function incrementDay(map: Map<number, number>, date: Date, amount = 1) {
  const day = getDayKey(date);
  map.set(day, (map.get(day) ?? 0) + amount);
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const now = new Date();
  const currentMonthStart = getMonthStart(now);
  const nextMonthStart = getMonthStart(now, 1);
  const previousMonthStart = getMonthStart(now, -1);
  const discoverySourcePeriod: AdminDiscoverySourcePeriod = "all";
  const discoverySourcePeriodStart = getDiscoverySourcePeriodStart(discoverySourcePeriod, now);
  const currentDays = getDaysInMonth(now);
  const previousDays = getDaysInMonth(previousMonthStart);

  try {
    const db = getDb();
    const [
      activeEventRows,
      pendingPaymentRows,
      totalUserRows,
      usersBeforeCurrentMonthRows,
      usersBeforePreviousMonthRows,
      monthlyUserRows,
      monthlyPaymentRows,
      discoverySourceRows,
      latestAuditLogRows,
    ] = await Promise.all([
      db
        .select({ value: count() })
        .from(events)
        .where(
          and(
            eq(events.status, "published"),
            gte(events.startsAt, now),
            gt(events.spotsAvailable, 0),
          ),
        ),
      db
        .select({ value: count() })
        .from(bookings)
        .where(inArray(bookings.status, ["pending", "pending_payment", "payment_failed"])),
      db.select({ value: count() }).from(authUsers),
      db
        .select({ value: count() })
        .from(authUsers)
        .where(lt(authUsers.createdAt, currentMonthStart)),
      db
        .select({ value: count() })
        .from(authUsers)
        .where(lt(authUsers.createdAt, previousMonthStart)),
      db
        .select({ createdAt: authUsers.createdAt })
        .from(authUsers)
        .where(
          and(
            gte(authUsers.createdAt, previousMonthStart),
            lt(authUsers.createdAt, nextMonthStart),
          ),
        ),
      db
        .select({ amountGroszy: payments.amountGroszy, createdAt: payments.createdAt })
        .from(payments)
        .where(
          and(
            eq(payments.status, "paid"),
            gte(payments.createdAt, previousMonthStart),
            lt(payments.createdAt, nextMonthStart),
          ),
        ),
      db
        .select({ source: profiles.discoverySource, value: count() })
        .from(authUsers)
        .leftJoin(profiles, eq(profiles.userId, authUsers.id))
        .where(
          discoverySourcePeriodStart
            ? gte(authUsers.createdAt, discoverySourcePeriodStart)
            : undefined,
        )
        .groupBy(profiles.discoverySource),
      db
        .select({
          action: adminAuditLogs.action,
          actorEmail: adminAuditLogs.actorEmail,
          actorName: adminAuditLogs.actorName,
          createdAt: adminAuditLogs.createdAt,
          entityId: adminAuditLogs.entityId,
          entityType: adminAuditLogs.entityType,
          id: adminAuditLogs.id,
          summary: adminAuditLogs.summary,
        })
        .from(adminAuditLogs)
        .orderBy(desc(adminAuditLogs.createdAt))
        .limit(6),
    ]);

    const currentPaymentMap = new Map<number, number>();
    const previousPaymentMap = new Map<number, number>();
    const currentUserMap = new Map<number, number>();
    const previousUserMap = new Map<number, number>();
    let monthlyRevenueGroszy = 0;

    monthlyPaymentRows.forEach((payment) => {
      if (payment.createdAt >= currentMonthStart) {
        monthlyRevenueGroszy += payment.amountGroszy;
        incrementDay(currentPaymentMap, payment.createdAt);
        return;
      }

      incrementDay(previousPaymentMap, payment.createdAt);
    });

    monthlyUserRows.forEach((user) => {
      if (user.createdAt >= currentMonthStart) {
        incrementDay(currentUserMap, user.createdAt);
        return;
      }

      incrementDay(previousUserMap, user.createdAt);
    });

    const activeEvents = Number(activeEventRows[0]?.value ?? 0);
    const pendingPaymentBookings = Number(pendingPaymentRows[0]?.value ?? 0);
    const totalUsers = Number(totalUserRows[0]?.value ?? 0);
    const usersBeforeCurrentMonth = Number(usersBeforeCurrentMonthRows[0]?.value ?? 0);
    const usersBeforePreviousMonth = Number(usersBeforePreviousMonthRows[0]?.value ?? 0);
    const discoverySourceChart = createDiscoverySourceDistribution(discoverySourceRows);

    return {
      activeEvents,
      discoverySourceChart,
      discoverySourcePeriod,
      discoverySourceTotal: discoverySourceChart.reduce((sum, source) => sum + source.count, 0),
      latestAuditLogs: latestAuditLogRows,
      monthlyRevenueGroszy,
      newUsersThisMonth: Array.from(currentUserMap.values()).reduce((sum, value) => sum + value, 0),
      paymentChart: createMonthSeries({
        currentDays,
        currentMap: currentPaymentMap,
        previousDays,
        previousMap: previousPaymentMap,
      }),
      pendingPaymentBookings,
      totalUsers,
      userChart: createMonthSeries({
        currentBaseTotal: usersBeforeCurrentMonth,
        currentDays,
        currentMap: currentUserMap,
        previousBaseTotal: usersBeforePreviousMonth,
        previousDays,
        previousMap: previousUserMap,
      }),
    };
  } catch (error) {
    console.error("Failed to load admin dashboard metrics", error);
    return emptyDashboardData(now, "all");
  }
}
