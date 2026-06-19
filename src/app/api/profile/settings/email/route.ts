import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuth } from "@/shared/server/auth/auth";

import { getApiErrorMessage, getSettingsSession, jsonError, readJson } from "../_utils";

const emailPayloadSchema = z.object({
  email: z.email("Введите корректный email."),
});

export async function POST(request: Request) {
  const session = await getSettingsSession(request);

  if (!session?.user) {
    return jsonError("Unauthorized", 401);
  }

  const parsed = emailPayloadSchema.safeParse(await readJson(request));

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Введите корректный email.");
  }

  try {
    await getAuth().api.changeEmail({
      body: {
        callbackURL: "/profile/settings",
        newEmail: parsed.data.email,
      },
      headers: request.headers,
    });
  } catch (error) {
    return jsonError(getApiErrorMessage(error));
  }

  return NextResponse.json({
    ok: true,
    message: "Мы отправили письмо с подтверждением на новую почту.",
  });
}
