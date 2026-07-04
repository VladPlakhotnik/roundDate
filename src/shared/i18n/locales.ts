export const locales = ["pl", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "pl";
export const localeCookieName = "rounddate-locale";

export const localeLabels = {
  en: "English",
  pl: "Polski",
} satisfies Record<Locale, string>;

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && locales.includes(value as Locale);
}

export function resolveLocale(value: unknown): Locale {
  return isLocale(value) ? value : defaultLocale;
}

export function resolveLocaleFromMarketingParam(value: unknown): Locale | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (["en", "eng", "english", "eu"].includes(normalized)) {
    return "en";
  }

  if (["pl", "pol", "polish", "polski"].includes(normalized)) {
    return "pl";
  }

  return null;
}
