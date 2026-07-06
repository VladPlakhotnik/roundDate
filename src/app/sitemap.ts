import type { MetadataRoute } from "next";

import { getEvents } from "@/entities/events";
import { absoluteSiteUrl } from "@/shared/config/site";

export const revalidate = 3600;

const publicRoutes = [
  {
    changeFrequency: "daily",
    path: "/",
    priority: 1,
  },
  {
    changeFrequency: "monthly",
    path: "/regulamin",
    priority: 0.4,
  },
  {
    changeFrequency: "monthly",
    path: "/privacy",
    priority: 0.4,
  },
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const events = await getEvents({
    limit: 100,
    statuses: ["published"],
    useFallback: false,
  });
  const eventRoutes = events.map((event) => ({
    changeFrequency: "weekly" as const,
    lastModified: new Date(event.updatedAt ?? event.startsAt),
    priority: 0.8,
    url: absoluteSiteUrl(`/wydarzenia/${event.slug}`),
  }));

  return [
    ...publicRoutes.map((route) => ({
      changeFrequency: route.changeFrequency,
      lastModified,
      priority: route.priority,
      url: absoluteSiteUrl(route.path),
    })),
    ...eventRoutes,
  ];
}
