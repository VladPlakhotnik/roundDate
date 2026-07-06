import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { localeCookieName, resolveLocaleFromMarketingParam } from "@/shared/i18n/locales";

const securityHeaders = {
  "Permissions-Policy": "camera=(), geolocation=(), microphone=()",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
} satisfies Record<string, string>;

function withSecurityHeaders(response: NextResponse) {
  for (const [name, value] of Object.entries(securityHeaders)) {
    response.headers.set(name, value);
  }

  return response;
}

export function proxy(request: NextRequest) {
  const locale = resolveLocaleFromMarketingParam(
    request.nextUrl.searchParams.get("language") ?? request.nextUrl.searchParams.get("lang"),
  );

  if (!locale) {
    return withSecurityHeaders(NextResponse.next());
  }

  const requestHeaders = new Headers(request.headers);

  requestHeaders.set("x-rounddate-locale", locale);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.cookies.set(localeCookieName, locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
  });

  return withSecurityHeaders(response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets).*)"],
};
