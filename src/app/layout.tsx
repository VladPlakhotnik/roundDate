import type { Metadata } from "next";
import { Geist_Mono, Manrope } from "next/font/google";

import {
  getPublicSiteUrl,
  siteDescription,
  siteName,
  siteOgImage,
  siteTitle,
} from "@/shared/config/site";
import { GoogleAnalytics } from "@/shared/analytics/GoogleAnalytics";
import { getRequestLocale } from "@/shared/i18n/server";

import { AppProviders } from "./providers";

import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const googleAnalyticsMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const metadata: Metadata = {
  applicationName: siteName,
  description: siteDescription,
  icons: {
    apple: "/icon.png",
    icon: "/favicon.ico",
  },
  metadataBase: new URL(getPublicSiteUrl()),
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
    locale: "pl_PL",
    siteName,
    title: siteTitle,
    type: "website",
    url: "/",
  },
  title: {
    default: siteTitle,
    template: `%s | ${siteName}`,
  },
  twitter: {
    card: "summary_large_image",
    description: siteDescription,
    images: [siteOgImage],
    title: siteTitle,
  },
  verification: {
    google: "fEUHZkjHhQrQpTTF0NDGV8prWKHJ9ed4zZX5gBdrDsU",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();

  return (
    <html
      lang={locale}
      className={`${manrope.variable} ${geistMono.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="flex min-h-full flex-col">
        <AppProviders locale={locale}>
          <GoogleAnalytics measurementId={googleAnalyticsMeasurementId} />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
