import type { MetadataRoute } from "next";

import { absoluteSiteUrl } from "@/shared/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      allow: "/",
      disallow: [
        "/admin/",
        "/api/",
        "/dev/",
        "/onboarding/",
        "/profile/",
        "/reset-password",
        "/sign-in",
      ],
      userAgent: "*",
    },
    sitemap: absoluteSiteUrl("/sitemap.xml"),
  };
}
