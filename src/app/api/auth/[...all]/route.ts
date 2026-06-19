export const runtime = "nodejs";

import { getAuth } from "@/shared/server/auth/auth";

async function authHandler(request: Request) {
  try {
    return await getAuth().handler(request);
  } catch (error) {
    if (error instanceof Error && /DATABASE_URL|BETTER_AUTH_SECRET/.test(error.message)) {
      return Response.json(
        {
          ok: false,
          error: error.message,
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
