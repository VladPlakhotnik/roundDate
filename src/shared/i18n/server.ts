import "server-only";

import { cookies, headers } from "next/headers";

import {
  localeCookieName,
  resolveLocale,
  resolveLocaleFromMarketingParam,
  type Locale,
} from "./locales";
import { createTranslator } from "./translate";

function parseCookieHeader(cookieHeader: string | null) {
  const cookies = new Map<string, string>();

  for (const pair of cookieHeader?.split(";") ?? []) {
    const [rawName, ...rawValueParts] = pair.split("=");
    const name = rawName?.trim();

    if (!name) {
      continue;
    }

    const rawValue = rawValueParts.join("=").trim();

    try {
      cookies.set(name, decodeURIComponent(rawValue));
    } catch {
      cookies.set(name, rawValue);
    }
  }

  return cookies;
}

export async function getRequestLocale(): Promise<Locale> {
  const [requestHeaders, cookieStore] = await Promise.all([headers(), cookies()]);
  const headerLocale = resolveLocaleFromMarketingParam(requestHeaders.get("x-rounddate-locale"));

  if (headerLocale) {
    return headerLocale;
  }

  return resolveLocale(cookieStore.get(localeCookieName)?.value);
}

export async function getRequestTranslator() {
  return createTranslator(await getRequestLocale());
}

export function getRequestLocaleFromRequest(request: Request): Locale {
  const url = new URL(request.url);
  const urlLocale = resolveLocaleFromMarketingParam(
    url.searchParams.get("language") ?? url.searchParams.get("lang"),
  );

  if (urlLocale) {
    return urlLocale;
  }

  const headerLocale = resolveLocaleFromMarketingParam(request.headers.get("x-rounddate-locale"));

  if (headerLocale) {
    return headerLocale;
  }

  return resolveLocale(parseCookieHeader(request.headers.get("cookie")).get(localeCookieName));
}

export function getRequestTranslatorFromRequest(request: Request) {
  return createTranslator(getRequestLocaleFromRequest(request));
}
