import type { HomeEvent } from "@/entities/events";
import { buildEventJsonLd, safeJsonLd } from "@/shared/seo/event-structured-data";
import {
  absoluteSiteUrl,
  siteLocalArea,
  siteDescription,
  siteName,
  siteSocialLinks,
  siteTitle,
} from "@/shared/config/site";
import { contactEmail } from "@/shared/config/contact";

export function buildHomeJsonLd(events: HomeEvent[]) {
  const siteUrl = absoluteSiteUrl("/");
  const organizationId = `${siteUrl}#organization`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@id": organizationId,
        "@type": "Organization",
        areaServed: {
          "@type": "City",
          address: {
            "@type": "PostalAddress",
            addressCountry: siteLocalArea.country,
            addressRegion: siteLocalArea.region,
          },
          name: siteLocalArea.city,
        },
        email: contactEmail,
        logo: absoluteSiteUrl("/assets/brand/rounddate-logo-email.png"),
        name: siteName,
        sameAs: [...siteSocialLinks],
        url: siteUrl,
      },
      {
        "@id": `${siteUrl}#website`,
        "@type": "WebSite",
        description: siteDescription,
        inLanguage: "pl-PL",
        name: siteTitle,
        publisher: {
          "@id": organizationId,
        },
        url: siteUrl,
      },
      ...events
        .slice(0, 6)
        .map((event) => buildEventJsonLd(event, { organizationId })),
    ],
  };
}

export function HomeSeoStructuredData({ events }: { events: HomeEvent[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: safeJsonLd(buildHomeJsonLd(events)),
      }}
    />
  );
}
