export const productionSiteUrl = "https://rounddate.pl";
export const siteName = "RoundDate";
export const siteTitle = "RoundDate Gdańsk | Speed dating offline";
export const siteDescription =
  "RoundDate to kameralne spotkania speed dating w Gdańsku. Poznaj ludzi offline, wybierz wydarzenie i sprawdź prawdziwą chemię na żywo.";
export const siteOgImage = "/assets/hero/gallery-main-v3.png";
export const siteSocialLinks = [
  "https://www.instagram.com/rounddategdansk",
  "https://www.facebook.com/rounddategdansk",
] as const;
export const siteLocalArea = {
  city: "Gdańsk",
  country: "PL",
  region: "Pomorskie",
} as const;

function isLocalHostname(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function getPublicSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!configuredUrl) {
    return productionSiteUrl;
  }

  try {
    const url = new URL(configuredUrl);

    if (process.env.NODE_ENV === "production" && isLocalHostname(url.hostname)) {
      return productionSiteUrl;
    }

    return url.origin;
  } catch {
    return productionSiteUrl;
  }
}

export function absoluteSiteUrl(path = "/") {
  return new URL(path, getPublicSiteUrl()).toString();
}
