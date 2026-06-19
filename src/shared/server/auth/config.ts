import "server-only";

export function getAuthBaseUrl() {
  return process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:6670";
}

export function getAuthSecret() {
  const secret = process.env.BETTER_AUTH_SECRET;

  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is required to initialize auth.");
  }

  return secret;
}
