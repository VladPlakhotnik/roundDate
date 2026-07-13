import "server-only";

import { and, asc, desc, eq, gt, gte, ilike, inArray, lte, or, type SQL } from "drizzle-orm";

import { splitEventGenderAvailability } from "@/entities/event/model/availability";
import { contactEmail } from "@/shared/config/contact";
import { defaultLocale } from "@/shared/i18n/locales";
import { createTranslator } from "@/shared/i18n/translate";
import { getAuth } from "@/shared/server/auth/auth";
import { getDb } from "@/shared/server/db/client";
import { bookings, events, payments, venues } from "@/shared/server/db/schema";
import type { BookingStatus, EventStatus } from "@/shared/types";

import { getNextAttendeeNumber } from "./matches";

type ServerTranslator = ReturnType<typeof createTranslator>;

export type BookingBadgeStatus =
  | "attended"
  | "cancelled"
  | "confirmed"
  | "event-ended"
  | "no-show"
  | "payment-failed"
  | "payment-pending"
  | "refunded"
  | "waitlist";

export type EventMapData = {
  bearing: number;
  center: readonly [number, number];
  cityLabel: string;
  districtLabel: string;
  marker: readonly [number, number];
  pitch: number;
  venueAddress: string;
  venueLabel: string;
  zoom: number;
};

export type HomeEvent = {
  address: string;
  ageMax: number;
  ageMin: number;
  ageRange: string;
  badge: string;
  capacityTotal: number;
  city: string;
  conversationMinutes: number;
  currency: string;
  dateLabel: string;
  dateValue: string;
  description: string;
  district: string;
  durationMinutes: number;
  femaleSpotsAvailable: number;
  highlights: string[];
  id: string;
  imageSrc: string;
  language: string;
  location: readonly [number, number];
  locationLabel: string;
  maleSpotsAvailable: number;
  mapLocation: EventMapData;
  organizer: {
    email: string;
    firstName: string;
    image?: string | null;
    lastName: string;
    phone: string;
  };
  price: number;
  priceLabel: string;
  slug: string;
  spotsAvailable: number;
  startsAt: string;
  status: EventStatus;
  statusLabel: string;
  tag: "all" | "closest" | "today" | "week" | "weekend";
  timeLabel: string;
  title: string;
  updatedAt?: string;
  venueAddress: string;
  venueName: string;
  weekdayLabel: string;
};

export type EventListTag = HomeEvent["tag"];
export type EventSortMode = "date" | "price-asc" | "price-desc";

export type EventListFilters = {
  ageFrom?: number;
  ageTo?: number;
  dateFrom?: Date;
  dateTo?: Date;
  district?: string;
  includePast?: boolean;
  limit?: number;
  priceFrom?: number;
  priceTo?: number;
  query?: string;
  sort?: EventSortMode;
  statuses?: EventStatus[];
  tag?: EventListTag;
  useFallback?: boolean;
};

export type EventBookingBlockReason = "past" | "sold-out" | "unavailable";

export function isRestartableBookingStatus(status: BookingStatus) {
  return status === "cancelled" || status === "refunded";
}

export function getEventBookingBlockReason(input: {
  hasExistingBooking: boolean;
  now?: Date;
  spotsAvailable: number;
  startsAt: Date;
  status: EventStatus;
}): EventBookingBlockReason | null {
  const now = input.now ?? new Date();

  if (input.startsAt.getTime() <= now.getTime()) {
    return "past";
  }

  if (["cancelled", "draft", "finished"].includes(input.status)) {
    return "unavailable";
  }

  if (!input.hasExistingBooking && (input.status === "sold_out" || input.spotsAvailable <= 0)) {
    return "sold-out";
  }

  if (!input.hasExistingBooking && input.status !== "published") {
    return "unavailable";
  }

  return null;
}

export function getEffectiveEventStatus(
  status: EventStatus,
  startsAt: Date,
  now = new Date(),
): EventStatus {
  if (
    (status === "published" || status === "sold_out") &&
    !Number.isNaN(startsAt.getTime()) &&
    startsAt.getTime() <= now.getTime()
  ) {
    return "finished";
  }

  return status;
}

export type UserBookingEvent = Omit<HomeEvent, "status"> & {
  attendeeNumber: number | null;
  bookingId: string;
  bookingStatus: BookingStatus;
  eventStatus: EventStatus;
  paymentLabel: string;
  paymentStatus: "failed" | "paid" | "pending" | "refunded" | null;
  status: BookingBadgeStatus;
  weekdayShort: string;
};

type EventRow = {
  ageMax: number;
  ageMin: number;
  badge: string | null;
  capacityTotal: number;
  city: string;
  conversationMinutes: number;
  currency: string;
  description: string | null;
  district: string | null;
  durationMinutes: number;
  femaleSpotsAvailable: number;
  id: string;
  imageSrc: string | null;
  language: string;
  latitude: number | null;
  longitude: number | null;
  maleSpotsAvailable: number;
  metadata: Record<string, unknown> | null;
  organizerEmail: string | null;
  organizerFirstName: string | null;
  organizerImage: string | null;
  organizerLastName: string | null;
  organizerPhone: string | null;
  priceGroszy: number;
  slug: string;
  spotsAvailable: number;
  startsAt: Date;
  status: EventStatus;
  title: string;
  updatedAt: Date;
  venueAddress: string | null;
  venueName: string | null;
};

const fallbackEvents = [
  {
    address: "ul. Chlebnicka 10/11, Gdańsk",
    ageMax: 35,
    ageMin: 25,
    badge: "Trwa nabór",
    capacityTotal: 20,
    city: "Gdańsk",
    conversationMinutes: 10,
    currency: "PLN",
    description: "Kameralny wieczór szybkich randek w centrum miasta z krótkimi rundami.",
    district: "Stare Miasto",
    durationMinutes: 120,
    femaleSpotsAvailable: 6,
    highlights: ["10-minutowe rundy", "Balans uczestników", "Kontakty po wzajemnej sympatii"],
    id: "seed-speed-dating-25-35-2031-05-24",
    imageSrc: "/assets/home-events/chairs-date.png",
    language: "PL/EN",
    location: [18.6533, 54.3464] as const,
    maleSpotsAvailable: 6,
    organizer: {
      email: contactEmail,
      firstName: "Anna",
      image: null,
      lastName: "Kowalska",
      phone: "+48 500 111 222",
    },
    priceGroszy: 12900,
    slug: "speed-dating-25-35-2031-05-24",
    spotsAvailable: 12,
    startsAt: "2031-05-24T19:00:00.000+02:00",
    status: "published" as const,
    title: "RoundDate 25-35",
    venueName: "Restaurant&Bar Stary Spichlerz",
  },
  {
    address: "ul. Słowackiego 23, Gdańsk",
    ageMax: 40,
    ageMin: 30,
    badge: "Prawie pełne",
    capacityTotal: 18,
    city: "Gdańsk",
    conversationMinutes: 10,
    currency: "PLN",
    description:
      "Przytulne spotkanie dla osób, które chcą poznać się offline bez długiego pisania.",
    district: "Wrzeszcz",
    durationMinutes: 125,
    femaleSpotsAvailable: 2,
    highlights: ["Welcome drink", "Mała grupa", "Moderator na miejscu"],
    id: "seed-speed-dating-30-40-2031-05-31",
    imageSrc: "/assets/home-events/chairs-flowers.png",
    language: "PL/EN",
    location: [18.6046, 54.381] as const,
    maleSpotsAvailable: 3,
    organizer: {
      email: "events@rounddate.pl",
      firstName: "Marta",
      image: null,
      lastName: "Nowak",
      phone: "+48 500 333 444",
    },
    priceGroszy: 12900,
    slug: "speed-dating-30-40-2031-05-31",
    spotsAvailable: 5,
    startsAt: "2031-05-31T19:00:00.000+02:00",
    status: "published" as const,
    title: "RoundDate 30-40",
    venueName: "Loft event space",
  },
  {
    address: "ul. Opacka 12, Gdańsk",
    ageMax: 45,
    ageMin: 35,
    badge: "Ostatnie miejsca",
    capacityTotal: 16,
    city: "Gdańsk",
    conversationMinutes: 8,
    currency: "PLN",
    description: "Spokojny format dla dojrzalszej grupy: mniej hałasu, więcej czasu na rozmowę.",
    district: "Oliwa",
    durationMinutes: 110,
    femaleSpotsAvailable: 1,
    highlights: ["Przytulne stoliki", "Grupa wiekowa 35-45", "Matche otwieramy po wydarzeniu"],
    id: "seed-speed-dating-35-45-2031-06-07",
    imageSrc: "/assets/home-events/chairs-coral.png",
    language: "PL/EN",
    location: [18.5605, 54.4104] as const,
    maleSpotsAvailable: 1,
    organizer: {
      email: "support@rounddate.pl",
      firstName: "Kasia",
      image: null,
      lastName: "Zielinska",
      phone: "+48 500 555 666",
    },
    priceGroszy: 13900,
    slug: "speed-dating-35-45-2031-06-07",
    spotsAvailable: 2,
    startsAt: "2031-06-07T18:30:00.000+02:00",
    status: "sold_out" as const,
    title: "RoundDate 35-45",
    venueName: "Garden lounge",
  },
  {
    address: "ul. Toruńska 12, Gdańsk",
    ageMax: 35,
    ageMin: 25,
    badge: "Zakończone",
    capacityTotal: 24,
    city: "Gdańsk",
    conversationMinutes: 10,
    currency: "PLN",
    description: "Miniony wieczór szybkich randek do sprawdzania historii użytkownika.",
    district: "Śródmieście",
    durationMinutes: 120,
    femaleSpotsAvailable: 0,
    highlights: ["Wydarzenie zakończone", "Wyniki dostępne", "Historia zostaje w profilu"],
    id: "seed-speed-dating-finished-2026-04-12",
    imageSrc: "/assets/atmosphere/conversation-03.png",
    language: "PL/EN",
    location: [18.6483, 54.3438] as const,
    maleSpotsAvailable: 0,
    organizer: {
      email: contactEmail,
      firstName: "Anna",
      image: null,
      lastName: "Kowalska",
      phone: "+48 500 111 222",
    },
    priceGroszy: 10900,
    slug: "speed-dating-finished-2026-04-12",
    spotsAvailable: 0,
    startsAt: "2026-04-12T19:00:00.000+02:00",
    status: "finished" as const,
    title: "RoundDate intro",
    venueName: "Hotel Almond",
  },
];

const dateFormatter = new Intl.DateTimeFormat("pl-PL", {
  day: "numeric",
  month: "long",
  timeZone: "Europe/Warsaw",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("pl-PL", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Warsaw",
});

const weekdayFormatter = new Intl.DateTimeFormat("pl-PL", {
  timeZone: "Europe/Warsaw",
  weekday: "long",
});

function formatPrice(priceGroszy: number, currency: string) {
  return `${Math.round(priceGroszy / 100)} ${currency}`;
}

function normalizeLegacyCity(city: string) {
  return city.trim().toLowerCase() === "\u0433\u0434\u0430\u043d\u044c\u0441\u043a"
    ? "Gdańsk"
    : city;
}

function normalizeLegacyBadge(badge: string) {
  const normalizedBadge = badge.trim().toLowerCase();
  const badgeMap: Record<string, string> = {
    "\u0438\u0434\u0435\u0442 \u043d\u0430\u0431\u043e\u0440": "Trwa nabór",
    "\u043d\u043e\u0432\u0430\u044f \u0434\u0430\u0442\u0430": "Nowa data",
    "\u043e\u0442\u043c\u0435\u043d\u0435\u043d\u043e": "Odwołane",
    "\u043f\u043e\u0441\u043b\u0435\u0434\u043d\u0438\u0435 \u043c\u0435\u0441\u0442\u0430":
      "Ostatnie miejsca",
    "\u043f\u043e\u0447\u0442\u0438 \u0437\u0430\u043f\u043e\u043b\u043d\u0435\u043d\u043e":
      "Prawie pełne",
    "\u043c\u0435\u0441\u0442\u0430 \u0435\u0441\u0442\u044c": "Są miejsca",
    "\u043c\u0435\u0441\u0442 \u043d\u0435\u0442": "Brak miejsc",
    "\u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u043e": "Zakończone",
  };

  return badgeMap[normalizedBadge] ?? badge;
}

function formatDateValue(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Warsaw",
    year: "numeric",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "2031";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
}

function readStringArray(metadata: Record<string, unknown> | null, key: string) {
  const value = metadata?.[key];

  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : undefined;
}

function getStatusLabel(status: EventStatus, spotsAvailable: number) {
  if (status === "finished") {
    return "Wydarzenie zakończone";
  }

  if (status === "cancelled") {
    return "Wydarzenie odwołane";
  }

  if (status === "sold_out" || spotsAvailable <= 0) {
    return "Brak miejsc";
  }

  return "Są miejsca";
}

function getBadge(status: EventStatus, spotsAvailable: number, badge?: string | null) {
  if (status === "finished") {
    return "Zakończone";
  }

  if (status === "cancelled") {
    return "Odwołane";
  }

  if (badge) {
    return normalizeLegacyBadge(badge);
  }

  if (status === "sold_out" || spotsAvailable <= 0) {
    return "Prawie pełne";
  }

  if (spotsAvailable <= 4) {
    return "Ostatnie miejsca";
  }

  return "Trwa nabór";
}

function getEventTag(startsAt: Date): HomeEvent["tag"] {
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const daysDiff = Math.floor((startsAt.getTime() - now.getTime()) / dayMs);

  if (daysDiff === 0) {
    return "today";
  }

  if (daysDiff >= 0 && daysDiff <= 7) {
    return "week";
  }

  if ([0, 6].includes(startsAt.getDay())) {
    return "weekend";
  }

  return "closest";
}

function normalizeEvent(input: {
  address: string;
  ageMax: number;
  ageMin: number;
  badge?: string | null;
  capacityTotal: number;
  city: string;
  conversationMinutes: number;
  currency: string;
  description: string;
  district: string;
  durationMinutes: number;
  femaleSpotsAvailable?: number;
  highlights?: string[];
  id: string;
  imageSrc?: string | null;
  language: string;
  location: readonly [number, number];
  maleSpotsAvailable?: number;
  organizer: HomeEvent["organizer"];
  priceGroszy: number;
  slug: string;
  spotsAvailable: number;
  startsAt: Date | string;
  status: EventStatus;
  title: string;
  updatedAt?: Date | string;
  venueName: string;
}): HomeEvent {
  const startsAt = new Date(input.startsAt);
  const updatedAt = new Date(input.updatedAt ?? startsAt);
  const status = getEffectiveEventStatus(input.status, startsAt);
  const city = normalizeLegacyCity(input.city);
  const weekday = weekdayFormatter.format(startsAt);
  const fallbackAvailability = splitEventGenderAvailability(input.spotsAvailable);
  const femaleSpotsAvailable = input.femaleSpotsAvailable ?? fallbackAvailability.female;
  const maleSpotsAvailable = input.maleSpotsAvailable ?? fallbackAvailability.male;
  const badge = getBadge(status, input.spotsAvailable, input.badge);
  const dateLabel = dateFormatter.format(startsAt);

  return {
    address: input.address,
    ageMax: input.ageMax,
    ageMin: input.ageMin,
    ageRange: `${input.ageMin}-${input.ageMax}`,
    badge,
    capacityTotal: input.capacityTotal,
    city,
    conversationMinutes: input.conversationMinutes,
    currency: input.currency,
    dateLabel,
    dateValue: formatDateValue(startsAt),
    description: input.description,
    district: input.district,
    durationMinutes: input.durationMinutes,
    femaleSpotsAvailable,
    highlights:
      input.highlights && input.highlights.length > 0
        ? input.highlights
        : [
            `${input.conversationMinutes}-minutowe rundy`,
            "Balans uczestników",
            "Kontakty otwierają się tylko przy wzajemnej sympatii",
          ],
    id: input.id,
    imageSrc: input.imageSrc ?? "/assets/atmosphere/conversation-03.png",
    language: input.language,
    location: input.location,
    locationLabel: `${city}, ${input.district}`,
    maleSpotsAvailable,
    mapLocation: {
      bearing: -18,
      center: input.location,
      cityLabel: city,
      districtLabel: input.district,
      marker: input.location,
      pitch: 58,
      venueAddress: input.address,
      venueLabel: input.venueName,
      zoom: 15.8,
    },
    organizer: input.organizer,
    price: Math.round(input.priceGroszy / 100),
    priceLabel: formatPrice(input.priceGroszy, input.currency),
    slug: input.slug,
    spotsAvailable: input.spotsAvailable,
    startsAt: startsAt.toISOString(),
    status,
    statusLabel: getStatusLabel(status, input.spotsAvailable),
    tag: getEventTag(startsAt),
    timeLabel: timeFormatter.format(startsAt),
    title: input.title,
    updatedAt: updatedAt.toISOString(),
    venueAddress: input.address,
    venueName: input.venueName,
    weekdayLabel: weekday.charAt(0).toUpperCase() + weekday.slice(1),
  };
}

function normalizeRow(row: EventRow): HomeEvent {
  const metadata = row.metadata;
  const highlights = readStringArray(metadata, "highlights");
  const location = [
    row.longitude ?? (Number(metadata?.longitude) || 18.6533),
    row.latitude ?? (Number(metadata?.latitude) || 54.3464),
  ] as const;
  const fallbackAvailability = splitEventGenderAvailability(row.spotsAvailable);

  return normalizeEvent({
    address: row.venueAddress ?? "ul. Chlebnicka 10/11, Gdansk",
    ageMax: row.ageMax,
    ageMin: row.ageMin,
    badge: row.badge,
    capacityTotal: row.capacityTotal,
    city: row.city,
    conversationMinutes: row.conversationMinutes,
    currency: row.currency,
    description:
      row.description ?? "Offline wieczór szybkich randek w prostym formacie z krótkimi rozmowami.",
    district: row.district ?? "Stare Miasto",
    durationMinutes: row.durationMinutes,
    femaleSpotsAvailable: row.femaleSpotsAvailable ?? fallbackAvailability.female,
    id: row.id,
    imageSrc: row.imageSrc,
    language: row.language,
    location,
    maleSpotsAvailable: row.maleSpotsAvailable ?? fallbackAvailability.male,
    organizer: {
      email: row.organizerEmail ?? contactEmail,
      firstName: row.organizerFirstName ?? "Anna",
      image: row.organizerImage,
      lastName: row.organizerLastName ?? "Kowalska",
      phone: row.organizerPhone ?? "+48 500 111 222",
    },
    priceGroszy: row.priceGroszy,
    slug: row.slug,
    spotsAvailable: row.spotsAvailable,
    startsAt: row.startsAt,
    status: row.status,
    title: row.title,
    updatedAt: row.updatedAt,
    venueName: row.venueName ?? "Kameralna sala",
    ...(highlights ? { highlights } : {}),
  });
}

function fallbackHomeEvents() {
  return fallbackEvents.map((event) => normalizeEvent(event));
}

function isFiniteNumber(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizeListQuery(query: string | undefined) {
  const trimmedQuery = query?.trim();

  return trimmedQuery ? trimmedQuery.toLowerCase() : undefined;
}

function isAllDistrict(district: string | undefined) {
  return !district || district === "all";
}

function isSelectedDistrict(district: string | undefined): district is string {
  return Boolean(district && district !== "all");
}

function isSameWarsawDate(date: Date, expectedDateValue: string) {
  return formatDateValue(date) === expectedDateValue;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function matchesEventTag(event: HomeEvent, tag: EventListTag | undefined) {
  if (!tag || tag === "all" || tag === "closest") {
    return true;
  }

  const startsAt = new Date(event.startsAt);
  const now = new Date();

  if (tag === "today") {
    return isSameWarsawDate(startsAt, formatDateValue(now));
  }

  if (tag === "week") {
    return startsAt >= now && startsAt <= addDays(now, 7);
  }

  return [0, 6].includes(startsAt.getDay());
}

function matchesListFilters(event: HomeEvent, input: EventListFilters | undefined) {
  const normalizedQuery = normalizeListQuery(input?.query);
  const startsAt = new Date(event.startsAt);

  if (!input?.includePast && startsAt < new Date()) {
    return false;
  }

  if (input?.statuses && !input.statuses.includes(event.status)) {
    return false;
  }

  if (event.spotsAvailable <= 0) {
    return false;
  }

  if (normalizedQuery) {
    const haystack = [
      event.title,
      event.description,
      event.venueName,
      event.venueAddress,
      event.address,
      event.district,
      event.city,
    ]
      .join(" ")
      .toLowerCase();

    if (!haystack.includes(normalizedQuery)) {
      return false;
    }
  }

  if (isFiniteNumber(input?.ageFrom) && event.ageMax < input.ageFrom) {
    return false;
  }

  if (isFiniteNumber(input?.ageTo) && event.ageMin > input.ageTo) {
    return false;
  }

  if (isFiniteNumber(input?.priceFrom) && event.price < input.priceFrom) {
    return false;
  }

  if (isFiniteNumber(input?.priceTo) && event.price > input.priceTo) {
    return false;
  }

  if (!isAllDistrict(input?.district) && event.district !== input?.district) {
    return false;
  }

  if (input?.dateFrom && startsAt < input.dateFrom) {
    return false;
  }

  if (input?.dateTo && startsAt > input.dateTo) {
    return false;
  }

  return matchesEventTag(event, input?.tag);
}

function sortEvents(eventsList: HomeEvent[], sort: EventSortMode | undefined) {
  return [...eventsList].sort((first, second) => {
    if (sort === "price-asc") {
      return first.price - second.price || first.startsAt.localeCompare(second.startsAt);
    }

    if (sort === "price-desc") {
      return second.price - first.price || first.startsAt.localeCompare(second.startsAt);
    }

    return first.startsAt.localeCompare(second.startsAt);
  });
}

function applyListFilters(eventsList: HomeEvent[], input: EventListFilters | undefined) {
  const filteredEvents = eventsList.filter((event) => matchesListFilters(event, input));
  const sortedEvents = sortEvents(filteredEvents, input?.sort);

  return input?.limit ? sortedEvents.slice(0, input.limit) : sortedEvents;
}

function eventSelection() {
  return {
    ageMax: events.ageMax,
    ageMin: events.ageMin,
    badge: events.badge,
    capacityTotal: events.capacityTotal,
    city: events.city,
    conversationMinutes: events.conversationMinutes,
    currency: events.currency,
    description: events.description,
    district: venues.district,
    durationMinutes: events.durationMinutes,
    femaleSpotsAvailable: events.femaleSpotsAvailable,
    id: events.id,
    imageSrc: events.imageSrc,
    language: events.language,
    latitude: venues.latitude,
    longitude: venues.longitude,
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
    updatedAt: events.updatedAt,
    venueAddress: venues.address,
    venueName: venues.name,
  };
}

export async function getEvents(input?: EventListFilters): Promise<HomeEvent[]> {
  const statuses = input?.statuses ?? ["published"];
  const useFallback = input?.useFallback ?? true;

  try {
    const db = getDb();
    const filters: SQL[] = [inArray(events.status, statuses), gt(events.spotsAvailable, 0)];
    const normalizedQuery = normalizeListQuery(input?.query);

    if (!input?.includePast) {
      filters.push(gte(events.startsAt, new Date()));
    }

    if (normalizedQuery) {
      const pattern = `%${normalizedQuery}%`;
      const searchFilter = or(
        ilike(events.title, pattern),
        ilike(events.description, pattern),
        ilike(events.city, pattern),
        ilike(venues.name, pattern),
        ilike(venues.address, pattern),
        ilike(venues.district, pattern),
      );

      if (searchFilter) {
        filters.push(searchFilter);
      }
    }

    if (isFiniteNumber(input?.ageFrom)) {
      filters.push(gte(events.ageMax, input.ageFrom));
    }

    if (isFiniteNumber(input?.ageTo)) {
      filters.push(lte(events.ageMin, input.ageTo));
    }

    if (isFiniteNumber(input?.priceFrom)) {
      filters.push(gte(events.priceGroszy, Math.round(input.priceFrom * 100)));
    }

    if (isFiniteNumber(input?.priceTo)) {
      filters.push(lte(events.priceGroszy, Math.round(input.priceTo * 100)));
    }

    const selectedDistrict = input?.district;

    if (isSelectedDistrict(selectedDistrict)) {
      filters.push(eq(venues.district, selectedDistrict));
    }

    if (input?.dateFrom) {
      filters.push(gte(events.startsAt, input.dateFrom));
    }

    if (input?.dateTo) {
      filters.push(lte(events.startsAt, input.dateTo));
    }

    const baseQuery = db
      .select(eventSelection())
      .from(events)
      .leftJoin(venues, eq(events.venueId, venues.id))
      .where(and(...filters));

    const rows =
      input?.sort === "price-asc"
        ? await baseQuery.orderBy(asc(events.priceGroszy), asc(events.startsAt))
        : input?.sort === "price-desc"
          ? await baseQuery.orderBy(desc(events.priceGroszy), asc(events.startsAt))
          : await baseQuery.orderBy(asc(events.startsAt));

    if (rows.length === 0) {
      if (!useFallback) {
        return [];
      }

      return applyListFilters(fallbackHomeEvents(), { ...input, statuses });
    }

    return applyListFilters(
      rows.map((row) => normalizeRow(row as EventRow)),
      { ...input, statuses },
    );
  } catch {
    if (!useFallback) {
      return [];
    }

    return applyListFilters(fallbackHomeEvents(), { ...input, statuses });
  }
}

export async function getHomeEvents(input?: { useFallback?: boolean }): Promise<HomeEvent[]> {
  return getEvents({
    limit: 3,
    statuses: ["published"],
    useFallback: input?.useFallback ?? true,
  });
}

export async function getEventBySlug(slug: string): Promise<HomeEvent | null> {
  try {
    const db = getDb();
    const [row] = await db
      .select(eventSelection())
      .from(events)
      .leftJoin(venues, eq(events.venueId, venues.id))
      .where(eq(events.slug, slug))
      .limit(1);

    return row ? normalizeRow(row as EventRow) : null;
  } catch {
    return fallbackHomeEvents().find((event) => event.slug === slug) ?? null;
  }
}

export function getBookingBadgeStatus(input: {
  eventStatus: EventStatus;
  now?: Date;
  startsAt: string;
  status: BookingStatus;
}): BookingBadgeStatus {
  const { status } = input;

  if (status === "attended") {
    return "attended";
  }

  if (status === "cancelled") {
    return "cancelled";
  }

  if (status === "no_show") {
    return "no-show";
  }

  if (status === "refunded") {
    return "refunded";
  }

  const startsAt = new Date(input.startsAt);

  if (
    input.eventStatus === "finished" ||
    (!Number.isNaN(startsAt.getTime()) && startsAt.getTime() <= (input.now ?? new Date()).getTime())
  ) {
    return "event-ended";
  }

  if (status === "confirmed") {
    return "confirmed";
  }

  if (status === "payment_failed") {
    return "payment-failed";
  }

  if (status === "waitlisted") {
    return "waitlist";
  }

  return "payment-pending";
}

export function selectLatestBookingPaymentRows<T extends { bookingId: string }>(rows: T[]) {
  const seenBookingIds = new Set<string>();

  return rows.filter((row) => {
    if (seenBookingIds.has(row.bookingId)) {
      return false;
    }

    seenBookingIds.add(row.bookingId);
    return true;
  });
}

function getBookingPaymentLabel(input: {
  bookingStatus: BookingStatus;
  eventEnded: boolean;
  paymentStatus: "failed" | "paid" | "pending" | "refunded" | null;
  priceLabel: string;
}) {
  if (input.bookingStatus === "attended") {
    return "Wydarzenie zakończone";
  }

  if (input.bookingStatus === "cancelled") {
    return "Zapis anulowany";
  }

  if (input.bookingStatus === "no_show") {
    return "Uczestnik nie przyszedł";
  }

  if (input.bookingStatus === "refunded" || input.paymentStatus === "refunded") {
    return `Zwrot: ${input.priceLabel}`;
  }

  if (input.bookingStatus === "waitlisted") {
    return "Lista oczekujących";
  }

  if (input.paymentStatus === "paid" || input.bookingStatus === "confirmed") {
    return `Opłacono: ${input.priceLabel}`;
  }

  if (input.eventEnded) {
    return "Wydarzenie zakończone";
  }

  if (input.paymentStatus === "failed" || input.bookingStatus === "payment_failed") {
    return `Płatność nieudana: ${input.priceLabel}`;
  }

  return `Płatność: ${input.priceLabel}`;
}

function toUserBookingEvent(input: {
  attendeeNumber: number | null;
  bookingId: string;
  bookingStatus: BookingStatus;
  event: HomeEvent;
  paymentStatus: "failed" | "paid" | "pending" | "refunded" | null;
}): UserBookingEvent {
  const startsAt = new Date(input.event.startsAt);
  const eventEnded =
    input.event.status === "finished" ||
    (!Number.isNaN(startsAt.getTime()) && startsAt.getTime() <= Date.now());
  const status = getBookingBadgeStatus({
    eventStatus: input.event.status,
    startsAt: input.event.startsAt,
    status: input.bookingStatus,
  });

  return {
    ...input.event,
    attendeeNumber: input.attendeeNumber,
    bookingId: input.bookingId,
    bookingStatus: input.bookingStatus,
    eventStatus: input.event.status,
    paymentLabel: getBookingPaymentLabel({
      bookingStatus: input.bookingStatus,
      eventEnded,
      paymentStatus: input.paymentStatus,
      priceLabel: input.event.priceLabel,
    }),
    paymentStatus: input.paymentStatus,
    status,
    weekdayShort: input.event.weekdayLabel.slice(0, 2).toLowerCase(),
  };
}

export async function getUserBookings(input: {
  headers: Headers;
  scope?: "all" | "past" | "upcoming";
}): Promise<UserBookingEvent[]> {
  const session = await getAuth().api.getSession({ headers: input.headers });

  if (!session?.user) {
    return [];
  }

  try {
    const db = getDb();
    const rows = await db
      .select({
        attendeeNumber: bookings.attendeeNumber,
        bookingId: bookings.id,
        bookingStatus: bookings.status,
        event: eventSelection(),
        paymentStatus: payments.status,
      })
      .from(bookings)
      .innerJoin(events, eq(bookings.eventId, events.id))
      .leftJoin(venues, eq(events.venueId, venues.id))
      .leftJoin(payments, eq(payments.bookingId, bookings.id))
      .where(eq(bookings.userId, session.user.id))
      .orderBy(asc(events.startsAt), desc(bookings.createdAt), desc(payments.createdAt));

    const normalized = selectLatestBookingPaymentRows(rows).map((row) =>
      toUserBookingEvent({
        attendeeNumber: row.attendeeNumber,
        bookingId: row.bookingId,
        bookingStatus: row.bookingStatus,
        event: normalizeRow(row.event as EventRow),
        paymentStatus: row.paymentStatus,
      }),
    );

    if (input.scope === "past") {
      return normalized.filter(
        (booking) =>
          new Date(booking.startsAt) < new Date() ||
          ["attended", "cancelled", "no_show", "refunded"].includes(booking.bookingStatus),
      );
    }

    if (input.scope === "upcoming") {
      return normalized.filter(
        (booking) =>
          new Date(booking.startsAt) >= new Date() &&
          !["attended", "cancelled", "no_show", "refunded"].includes(booking.bookingStatus),
      );
    }

    return normalized;
  } catch {
    return [];
  }
}

export async function createUserBooking(input: {
  eventId: string;
  headers: Headers;
  t?: ServerTranslator;
}): Promise<{ booking: UserBookingEvent | null; error?: string; status: number }> {
  const t = input.t ?? createTranslator(defaultLocale);
  const session = await getAuth().api.getSession({ headers: input.headers });

  if (!session?.user) {
    return { booking: null, error: t("api.bookings.loginRequired"), status: 401 };
  }

  try {
    const db = getDb();
    const [eventRow] = await db
      .select(eventSelection())
      .from(events)
      .leftJoin(venues, eq(events.venueId, venues.id))
      .where(eq(events.id, input.eventId))
      .limit(1);

    if (!eventRow) {
      return { booking: null, error: t("api.bookings.eventNotFound"), status: 404 };
    }

    const event = normalizeRow(eventRow as EventRow);
    const [existingBooking] = await db
      .select({ attendeeNumber: bookings.attendeeNumber, id: bookings.id, status: bookings.status })
      .from(bookings)
      .where(and(eq(bookings.userId, session.user.id), eq(bookings.eventId, input.eventId)))
      .limit(1);
    const restartExistingBooking = existingBooking
      ? isRestartableBookingStatus(existingBooking.status)
      : false;
    const bookingBlockReason = getEventBookingBlockReason({
      hasExistingBooking: Boolean(existingBooking) && !restartExistingBooking,
      spotsAvailable: event.spotsAvailable,
      startsAt: new Date(event.startsAt),
      status: event.status,
    });

    if (bookingBlockReason === "past") {
      return { booking: null, error: t("api.bookings.eventPast"), status: 409 };
    }

    if (bookingBlockReason === "sold-out") {
      return { booking: null, error: t("api.bookings.eventSoldOut"), status: 409 };
    }

    if (bookingBlockReason === "unavailable") {
      return { booking: null, error: t("api.bookings.eventUnavailable"), status: 409 };
    }

    if (existingBooking && restartExistingBooking) {
      const [restartedBooking] = await db
        .update(bookings)
        .set({
          status: "pending_payment",
          stripeCheckoutSessionId: null,
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, existingBooking.id))
        .returning({
          attendeeNumber: bookings.attendeeNumber,
          id: bookings.id,
          status: bookings.status,
        });

      if (!restartedBooking) {
        return { booking: null, error: t("api.bookings.createError"), status: 500 };
      }

      return {
        booking: toUserBookingEvent({
          attendeeNumber: restartedBooking.attendeeNumber,
          bookingId: restartedBooking.id,
          bookingStatus: restartedBooking.status,
          event,
          paymentStatus: "pending",
        }),
        status: 200,
      };
    }

    if (existingBooking) {
      return {
        booking: toUserBookingEvent({
          attendeeNumber: existingBooking.attendeeNumber,
          bookingId: existingBooking.id,
          bookingStatus: existingBooking.status,
          event,
          paymentStatus: existingBooking.status === "confirmed" ? "paid" : "pending",
        }),
        status: 200,
      };
    }

    const bookingStatus: BookingStatus = "pending_payment";
    const attendeeNumber = getNextAttendeeNumber(
      (
        await db
          .select({ attendeeNumber: bookings.attendeeNumber })
          .from(bookings)
          .where(eq(bookings.eventId, input.eventId))
      ).map((booking) => booking.attendeeNumber),
    );
    const [createdBooking] = await db
      .insert(bookings)
      .values({
        attendeeNumber,
        eventId: input.eventId,
        status: bookingStatus,
        userId: session.user.id,
      })
      .returning({
        attendeeNumber: bookings.attendeeNumber,
        id: bookings.id,
        status: bookings.status,
      });

    if (!createdBooking) {
      return { booking: null, error: t("api.bookings.createError"), status: 500 };
    }

    return {
      booking: toUserBookingEvent({
        attendeeNumber: createdBooking.attendeeNumber,
        bookingId: createdBooking.id,
        bookingStatus: createdBooking.status,
        event,
        paymentStatus: "pending",
      }),
      status: 201,
    };
  } catch {
    return { booking: null, error: t("api.bookings.createError"), status: 500 };
  }
}
