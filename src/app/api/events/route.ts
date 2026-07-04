import { NextResponse } from "next/server";

import { getEvents, type EventListTag, type EventSortMode } from "@/entities/events";
import type { EventStatus } from "@/shared/types";

const eventStatuses = new Set<EventStatus>([
  "cancelled",
  "draft",
  "finished",
  "published",
  "sold_out",
]);
const eventTags = new Set<EventListTag>(["all", "closest", "today", "week", "weekend"]);
const eventSortModes = new Set<EventSortMode>(["date", "price-asc", "price-desc"]);

function parseStatuses(value: string | null) {
  if (!value) {
    return undefined;
  }

  const statuses = value
    .split(",")
    .map((status) => status.trim())
    .filter((status): status is EventStatus => eventStatuses.has(status as EventStatus));

  return statuses.length > 0 ? statuses : undefined;
}

function parseNumber(value: string | null) {
  if (!value) {
    return undefined;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function parseDate(value: string | null, boundary: "end" | "start") {
  if (!value) {
    return undefined;
  }

  const suffix = boundary === "end" ? "T23:59:59.999+02:00" : "T00:00:00.000+02:00";
  const date = new Date(`${value}${suffix}`);

  return Number.isNaN(date.getTime()) ? undefined : date;
}

function parseTag(value: string | null) {
  return eventTags.has(value as EventListTag) ? (value as EventListTag) : undefined;
}

function parseSort(value: string | null) {
  return eventSortModes.has(value as EventSortMode) ? (value as EventSortMode) : undefined;
}

function parseQuery(value: string | null) {
  const query = value?.trim();

  return query ? query : undefined;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const includePast = url.searchParams.get("includePast") === "true";
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;
  const statuses = parseStatuses(url.searchParams.get("status"));
  const query = parseQuery(url.searchParams.get("query") ?? url.searchParams.get("search"));
  const ageFrom = parseNumber(url.searchParams.get("ageFrom"));
  const ageTo = parseNumber(url.searchParams.get("ageTo"));
  const priceFrom = parseNumber(url.searchParams.get("priceFrom"));
  const priceTo = parseNumber(url.searchParams.get("priceTo"));
  const dateFrom = parseDate(url.searchParams.get("dateFrom"), "start");
  const dateTo = parseDate(url.searchParams.get("dateTo"), "end");
  const district = parseQuery(url.searchParams.get("district"));
  const tag = parseTag(url.searchParams.get("tag"));
  const sort = parseSort(url.searchParams.get("sort"));
  const events = await getEvents({
    includePast,
    ...(Number.isFinite(limit) && limit ? { limit } : {}),
    ...(statuses ? { statuses } : {}),
    ...(query ? { query } : {}),
    ...(ageFrom !== undefined ? { ageFrom } : {}),
    ...(ageTo !== undefined ? { ageTo } : {}),
    ...(priceFrom !== undefined ? { priceFrom } : {}),
    ...(priceTo !== undefined ? { priceTo } : {}),
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
    ...(district ? { district } : {}),
    ...(tag ? { tag } : {}),
    ...(sort ? { sort } : {}),
  });

  return NextResponse.json({ events });
}
