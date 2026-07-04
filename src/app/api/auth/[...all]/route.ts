export const runtime = "nodejs";

import { getAuth } from "@/shared/server/auth/auth";
import { getRequestTranslatorFromRequest } from "@/shared/i18n/server";

async function authHandler(request: Request) {
  try {
    return await getAuth().handler(request);
  } catch (error) {
    if (error instanceof Error && /DATABASE_URL|BETTER_AUTH_SECRET/.test(error.message)) {
      const t = getRequestTranslatorFromRequest(request);

      return Response.json(
        {
          ok: false,
          error: t("api.auth.configurationError"),
        },
        { status: 503 },
      );
    }

    throw error;
  }
}

export const GET = authHandler;
export const POST = authHandler;
export const PUT = authHandler;
export const PATCH = authHandler;
export const DELETE = authHandler;
