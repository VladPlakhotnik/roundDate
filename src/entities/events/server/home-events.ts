import "server-only";

import { and, asc, eq, gte, inArray } from "drizzle-orm";

import { getDb } from "@/shared/server/db/client";
import { events, venues } from "@/shared/server/db/schema";

type EventStatus = "draft" | "published" | "sold_out" | "finished";

type EventMetadata = {
  ageRange?: string;
  badge?: string;
  highlights?: string[];
  language?: string;
};

export type HomeEvent = {
  ageRange: string;
  badge: string;
  capacityTotal: number;
  city: string;
  conversationMinutes: number;
  currency: string;
  dateLabel: string;
  description: string;
  durationMinutes: number;
  highlights: string[];
  id: string;
  language: string;
  locationLabel: string;
  priceLabel: string;
  slug: string;
  spotsAvailable: number;
  startsAt: string;
  status: EventStatus;
  statusLabel: string;
  timeLabel: string;
  title: string;
  venueAddress: string;
  venueName: string;
  weekdayLabel: string;
};

type EventSource = {
  ageRange: string;
  badge: string;
  capacityTotal: number;
  city: string;
  conversationMinutes: number;
  currency: string;
  description: string;
  durationMinutes: number;
  highlights: string[];
  id: string;
  language: string;
  priceGroszy: number;
  slug: string;
  spotsAvailable: number;
  startsAt: string;
  status: EventStatus;
  title: string;
  venueAddress: string;
  venueName: string;
};

const seedEvents: EventSource[] = [
  {
    ageRange: "25-35",
    badge: "идёт набор",
    capacityTotal: 32,
    city: "Гданьск",
    conversationMinutes: 10,
    currency: "PLN",
    description: "Камерный вечер быстрых знакомств с короткими раундами и понятным темпом.",
    durationMinutes: 120,
    highlights: ["10-минутные раунды", "Баланс участников", "Контакты только при взаимной симпатии"],
    id: "seed-wine-conversations-2026-06-27",
    language: "RU/PL",
    priceGroszy: 6900,
    slug: "speed-dating-25-35-2031-05-24",
    spotsAvailable: 12,
    startsAt: "2031-05-24T19:00:00.000+02:00",
    status: "published",
    title: "Speed dating 25-35",
    venueAddress: "Старый город",
    venueName: "Kameralna sala",
  },
  {
    ageRange: "32-44",
    badge: "идёт набор",
    capacityTotal: 36,
    city: "Гданьск",
    conversationMinutes: 10,
    currency: "PLN",
    description: "Летняя встреча для тех, кто хочет познакомиться офлайн без долгих переписок.",
    durationMinutes: 135,
    highlights: ["Welcome drink", "Несколько возрастных мини-групп", "После события открываем мэтчи"],
    id: "seed-summer-match-night-2026-07-04",
    language: "RU/PL/EN",
    priceGroszy: 6900,
    slug: "speed-dating-32-44-2031-05-31",
    spotsAvailable: 8,
    startsAt: "2031-05-31T19:00:00.000+02:00",
    status: "published",
    title: "Speed dating 32-44",
    venueAddress: "Wrzeszcz",
    venueName: "Loft event space",
  },
  {
    ageRange: "40+",
    badge: "почти заполнено",
    capacityTotal: 28,
    city: "Гданьск",
    conversationMinutes: 8,
    currency: "PLN",
    description: "Спокойный формат для зрелой аудитории: меньше шума, больше времени на разговор.",
    durationMinutes: 110,
    highlights: ["Уютная посадка", "Маленькая группа", "Модератор на месте"],
    id: "seed-slow-dating-2026-07-18",
    language: "RU/PL",
    priceGroszy: 6900,
    slug: "evening-40-plus-2031-06-07",
    spotsAvailable: 2,
    startsAt: "2031-06-07T18:30:00.000+02:00",
    status: "published",
    title: "Вечер знакомств 40+",
    venueAddress: "Oliwa",
    venueName: "Garden lounge",
  },
];

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  timeZone: "Europe/Warsaw",
});

const timeFormatter = new Intl.DateTimeFormat("ru-RU", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Warsaw",
});

const weekdayFormatter = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Europe/Warsaw",
  weekday: "long",
});

function parseMetadata(metadata: Record<string, unknown> | null | undefined): EventMetadata {
  if (!metadata) {
    return {};
  }

  const parsed: EventMetadata = {};
  const ageRange = typeof metadata.ageRange === "string" ? metadata.ageRange : undefined;
  const badge = typeof metadata.badge === "string" ? metadata.badge : undefined;
  const language = typeof metadata.language === "string" ? metadata.language : undefined;
  const highlights = Array.isArray(metadata.highlights)
    ? metadata.highlights.filter((item): item is string => typeof item === "string")
    : undefined;

  if (ageRange) {
    parsed.ageRange = ageRange;
  }

  if (badge) {
    parsed.badge = badge;
  }

  if (language) {
    parsed.language = language;
  }

  if (highlights && highlights.length > 0) {
    parsed.highlights = highlights;
  }

  return parsed;
}

function formatPrice(priceGroszy: number, currency: string) {
  return `${Math.round(priceGroszy / 100)} ${currency}`;
}

function normalizeEvent(source: EventSource): HomeEvent {
  const startsAt = new Date(source.startsAt);
  const weekday = weekdayFormatter.format(startsAt);
  const statusLabel =
    source.status === "sold_out"
      ? "Мест нет"
      : source.spotsAvailable <= 3
        ? "последние места"
        : `${source.spotsAvailable} мест осталось`;

  return {
    ageRange: source.ageRange,
    badge: source.badge,
    capacityTotal: source.capacityTotal,
    city: source.city,
    conversationMinutes: source.conversationMinutes,
    currency: source.currency,
    dateLabel: dateFormatter.format(startsAt),
    description: source.description,
    durationMinutes: source.durationMinutes,
    highlights: source.highlights,
    id: source.id,
    language: source.language,
    locationLabel: `${source.city}, ${source.venueAddress}`,
    priceLabel: formatPrice(source.priceGroszy, source.currency),
    slug: source.slug,
    spotsAvailable: source.spotsAvailable,
    startsAt: source.startsAt,
    status: source.status,
    statusLabel,
    timeLabel: timeFormatter.format(startsAt),
    title: source.title,
    venueAddress: source.venueAddress,
    venueName: source.venueName,
    weekdayLabel: weekday.charAt(0).toUpperCase() + weekday.slice(1),
  };
}

export async function getHomeEvents(): Promise<HomeEvent[]> {
  try {
    const db = getDb();
    const rows = await db
      .select({
        capacityTotal: events.capacityTotal,
        city: events.city,
        conversationMinutes: events.conversationMinutes,
        currency: events.currency,
        description: events.description,
        durationMinutes: events.durationMinutes,
        id: events.id,
        metadata: events.metadata,
        priceGroszy: events.priceGroszy,
        slug: events.slug,
        spotsAvailable: events.spotsAvailable,
        startsAt: events.startsAt,
        status: events.status,
        title: events.title,
        venueAddress: venues.address,
        venueName: venues.name,
      })
      .from(events)
      .leftJoin(venues, eq(events.venueId, venues.id))
      .where(
        and(
          gte(events.startsAt, new Date()),
          inArray(events.status, ["published", "sold_out"]),
        ),
      )
      .orderBy(asc(events.startsAt))
      .limit(3);

    if (rows.length === 0) {
      return seedEvents.map(normalizeEvent);
    }

    return rows.map((row) => {
      const metadata = parseMetadata(row.metadata);

      return normalizeEvent({
        ageRange: metadata.ageRange ?? "25-35",
        badge: metadata.badge ?? "Ближайшее",
        capacityTotal: row.capacityTotal,
        city: row.city,
        conversationMinutes: row.conversationMinutes,
        currency: row.currency,
        description: row.description ?? "Офлайн-вечер быстрых знакомств в понятном формате.",
        durationMinutes: row.durationMinutes,
        highlights: metadata.highlights ?? [
          `${row.conversationMinutes}-минутные раунды`,
          "Баланс участников",
          "Контакты только при взаимной симпатии",
        ],
        id: row.id,
        language: metadata.language ?? "RU/PL",
        priceGroszy: row.priceGroszy,
        slug: row.slug,
        spotsAvailable: row.spotsAvailable,
        startsAt: row.startsAt.toISOString(),
        status: row.status,
        title: row.title,
        venueAddress: row.venueAddress ?? "Stare Miasto",
        venueName: row.venueName ?? "Kameralna sala",
      });
    });
  } catch {
    return seedEvents.map(normalizeEvent);
  }
}
