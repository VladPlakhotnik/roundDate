import type { Metadata } from "next";

import { siteDescription, siteOgImage, siteTitle } from "@/shared/config/site";
import { HomeView } from "@/views/home/page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  description: siteDescription,
  openGraph: {
    description: siteDescription,
    images: [
      {
        alt: "RoundDate speed dating w Gdańsku",
        height: 630,
        url: siteOgImage,
        width: 1200,
      },
    ],
    title: siteTitle,
    url: "/",
  },
  title: {
    absolute: siteTitle,
  },
  twitter: {
    card: "summary_large_image",
    description: siteDescription,
    images: [siteOgImage],
    title: siteTitle,
  },
};

export default function Home() {
  return <HomeView />;
}
