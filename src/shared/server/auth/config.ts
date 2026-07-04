import "server-only";

import type { BaseURLConfig } from "better-auth";

const localAuthUrl = "http://localhost:6670";
const productionAuthUrl = "https://rounddate.pl";

function unique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function parseList(value: string | undefined) {
  return (
    value
      ?.split(/[,\s]+/)
      .map((item) => item.trim())
      .filter(Boolean) ?? []
  );
}

function withHttps(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function isLocalUrl(value: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::|\/|$)/i.test(value);
}

function toOrigin(value: string | undefined) {
  if (!value) {
    return null;
  }

  const normalized = stripTrailingSlash(withHttps(value.trim()));

  if (!normalized || normalized.includes("*") || normalized.includes("?")) {
    return normalized || null;
  }

  try {
    return new URL(normalized).origin;
  } catch {
    return null;
  }
}

function toHost(value: string | undefined) {
  if (!value) {
    return null;
  }

  const normalized = stripTrailingSlash(withHttps(value.trim()));

  if (!normalized || normalized.includes("*") || normalized.includes("?")) {
    return normalized.replace(/^https?:\/\//i, "") || null;
  }

  try {
    return new URL(normalized).host;
  } catch {
    return null;
  }
}

function getVercelUrl() {
  return process.env.VERCEL_URL ? withHttps(process.env.VERCEL_URL) : undefined;
}

function getAuthFallbackUrl() {
  const configuredUrl = stripTrailingSlash(
    process.env.BETTER_AUTH_URL ??
      process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.NODE_ENV === "production" ? productionAuthUrl : localAuthUrl),
  );

  if (process.env.NODE_ENV === "production" && isLocalUrl(configuredUrl)) {
    return productionAuthUrl;
  }

  return configuredUrl;
}

function getAuthAllowedHosts() {
  return unique([
    toHost(getAuthFallbackUrl()),
    toHost(process.env.NEXT_PUBLIC_APP_URL),
    toHost(getVercelUrl()),
    ...parseList(process.env.BETTER_AUTH_ALLOWED_HOSTS).map(toHost),
  ]);
}

export function getAuthBaseUrl(): BaseURLConfig {
  const fallback = getAuthFallbackUrl();

  return {
    allowedHosts: getAuthAllowedHosts(),
    fallback,
    protocol: fallback.startsWith("http://") ? "http" : "https",
  };
}

export function getAuthTrustedOrigins() {
  return unique([
    toOrigin(getAuthFallbackUrl()),
    toOrigin(process.env.NEXT_PUBLIC_APP_URL),
    toOrigin(getVercelUrl()),
    ...parseList(process.env.BETTER_AUTH_TRUSTED_ORIGINS).map(toOrigin),
  ]);
}

export function getAuthSecret() {
  const secret = process.env.BETTER_AUTH_SECRET;

  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is required to initialize auth.");
  }

  return secret;
}
