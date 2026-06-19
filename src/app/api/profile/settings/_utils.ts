import { NextResponse } from "next/server";

import { getAuth } from "@/shared/server/auth/auth";

export async function getSettingsSession(request: Request) {
  return getAuth().api.getSession({ headers: request.headers });
}

export async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function nullableText(value: string) {
  const trimmed = value.trim();

  return trimmed || null;
}

export function getApiErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }

  return "Что-то пошло не так. Попробуйте еще раз.";
}

export function expireAuthCookies(response: NextResponse) {
  const cookieNames = [
    "better-auth.session_token",
    "better-auth.session_data",
    "better-auth.account_data",
    "better-auth.dont_remember",
  ];

  for (const name of cookieNames) {
    response.cookies.set(name, "", {
      maxAge: 0,
      path: "/",
    });
  }

  return response;
}
