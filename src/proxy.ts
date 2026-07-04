import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { localeCookieName, resolveLocaleFromMarketingParam } from "@/shared/i18n/locales";

export function proxy(request: NextRequest) {
  const locale = resolveLocaleFromMarketingParam(
    request.nextUrl.searchParams.get("language") ?? request.nextUrl.searchParams.get("lang"),
  );

  if (!locale) {
    return NextResponse.next();
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
  });

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets).*)"],
};
