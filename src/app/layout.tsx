import type { Metadata } from "next";
import { Geist_Mono, Manrope } from "next/font/google";

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

export const metadata: Metadata = {
  verification: {
    google: "fEUHZkjHhQrQpTTF0NDGV8prWKHJ9ed4zZX5gBdrDsU",
  },
  title: "RoundDate Gdańsk",
  description: "Spotkania offline RoundDate w Gdańsku.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();

  return (
    <html lang={locale} className={`${manrope.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <AppProviders locale={locale}>{children}</AppProviders>
      </body>
    </html>
  );
}
