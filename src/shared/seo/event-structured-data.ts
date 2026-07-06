import type { HomeEvent } from "@/entities/events";
import { contactEmail } from "@/shared/config/contact";
import { absoluteSiteUrl, siteName, siteOgImage, siteSocialLinks } from "@/shared/config/site";

export const publicEventStatuses = new Set<HomeEvent["status"]>(["published", "sold_out"]);

export function eventPath(event: Pick<HomeEvent, "slug">) {
  return `/wydarzenia/${event.slug}`;
}

export function isPublicEvent(event: HomeEvent | null): event is HomeEvent {
  if (!event || !publicEventStatuses.has(event.status)) {
    return false;
  }

  return new Date(event.startsAt).getTime() >= Date.now();
}

export function getEventImage(event: Pick<HomeEvent, "imageSrc">) {
  return event.imageSrc || siteOgImage;
}

export function getCityLocative(city: string) {
  return city === "Gdańsk" ? "Gdańsku" : city;
}

export function getEventEndDate(event: Pick<HomeEvent, "durationMinutes" | "startsAt">) {
  const startsAt = new Date(event.startsAt);
  const startsAtMs = startsAt.getTime();
  const durationMinutes = Number.isFinite(event.durationMinutes) ? event.durationMinutes : 120;

  if (!Number.isFinite(startsAtMs)) {
    return event.startsAt;
  }

  return new Date(startsAtMs + durationMinutes * 60_000).toISOString();
}

export function getEventSeoDescription(event: HomeEvent) {
  return (
    `Speed dating ${event.ageRange} w ${getCityLocative(event.city)}: ${event.dateLabel} o ${event.timeLabel}. ` +
    `Kameralne spotkanie offline RoundDate, ${event.priceLabel}, ${event.spotsAvailable} wolnych miejsc.`
  );
}

export function getEventLead(event: HomeEvent) {
  return event.description || getEventSeoDescription(event);
}

export function getSchemaEventStatus(event: Pick<HomeEvent, "status">) {
  if (event.status === "cancelled") {
    return "https://schema.org/EventCancelled";
  }

  return "https://schema.org/EventScheduled";
}

export function getSchemaOfferAvailability(event: Pick<HomeEvent, "spotsAvailable" | "status">) {
  if (event.status === "sold_out" || event.spotsAvailable <= 0) {
    return "https://schema.org/SoldOut";
  }

  return "https://schema.org/InStock";
}

function getSchemaLanguage(language: string | undefined) {
  const normalized = (language || "pl").toLowerCase();

  if (normalized.includes("en")) {
    return "pl-PL,en";
  }

  return "pl-PL";
}

function getGeo(event: HomeEvent) {
  if (!Array.isArray(event.location) || event.location.length < 2) {
    return undefined;
  }

  const [longitude, latitude] = event.location;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return undefined;
  }

  return {
    "@type": "GeoCoordinates",
    latitude,
    longitude,
  };
}

type BuildEventJsonLdOptions = {
  organizationId?: string;
};

export function buildEventJsonLd(event: HomeEvent, options: BuildEventJsonLdOptions = {}) {
  const pageUrl = absoluteSiteUrl(eventPath(event));
  const eventImage = absoluteSiteUrl(getEventImage(event));
  const organizer = options.organizationId
    ? {
        "@id": options.organizationId,
      }
    : {
        "@type": "Organization",
        email: contactEmail,
        logo: absoluteSiteUrl("/assets/brand/rounddate-logo-email.png"),
        name: siteName,
        sameAs: [...siteSocialLinks],
        url: absoluteSiteUrl("/"),
      };

  return {
    "@id": `${pageUrl}#event`,
    "@type": "Event",
    description: getEventSeoDescription(event),
    endDate: getEventEndDate(event),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: getSchemaEventStatus(event),
    image: [eventImage],
    inLanguage: getSchemaLanguage(event.language),
    isAccessibleForFree: event.price <= 0,
    keywords: [
      `speed dating ${event.ageRange}`,
      `speed dating ${event.city}`,
      "randki offline",
      "RoundDate",
    ],
    location: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressCountry: "PL",
        addressLocality: event.city,
        addressRegion: "Pomorskie",
        streetAddress: event.venueAddress,
      },
      geo: getGeo(event),
      name: event.venueName,
    },
    maximumAttendeeCapacity: event.capacityTotal,
    name: event.title,
    offers: {
      "@type": "Offer",
      availability: getSchemaOfferAvailability(event),
      price: event.price,
      priceCurrency: event.currency,
      url: pageUrl,
      validFrom: event.updatedAt ?? event.startsAt,
    },
    organizer,
    remainingAttendeeCapacity: Math.max(event.spotsAvailable, 0),
    startDate: event.startsAt,
    typicalAgeRange: event.ageRange,
    url: pageUrl,
  };
}

export function buildEventBreadcrumbJsonLd(event: HomeEvent) {
  return {
    "@id": `${absoluteSiteUrl(eventPath(event))}#breadcrumb`,
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        item: absoluteSiteUrl("/"),
        name: "RoundDate",
        position: 1,
      },
      {
        "@type": "ListItem",
        item: absoluteSiteUrl("/#events"),
        name: "Wydarzenia",
        position: 2,
      },
      {
        "@type": "ListItem",
        item: absoluteSiteUrl(eventPath(event)),
        name: event.title,
        position: 3,
      },
    ],
  };
}

export function buildEventPageJsonLd(event: HomeEvent) {
  return {
    "@context": "https://schema.org",
    "@graph": [buildEventJsonLd(event), buildEventBreadcrumbJsonLd(event)],
  };
}

export function safeJsonLd(input: unknown) {
  return JSON.stringify(input).replace(/</g, "\\u003c");
}
