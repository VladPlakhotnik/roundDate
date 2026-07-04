import { NextResponse } from "next/server";
import { z } from "zod";

import { emailSchema } from "@/shared/lib/validation/contact";
import { getAuth } from "@/shared/server/auth/auth";

import {
  getApiErrorMessage,
  getSettingsSession,
  getSettingsTranslator,
  jsonError,
  readJson,
} from "../_utils";

const emailPayloadSchema = z.object({
  email: emailSchema,
});

export async function POST(request: Request) {
  const t = getSettingsTranslator(request);
  const session = await getSettingsSession(request);

  if (!session?.user) {
    return jsonError(t("api.common.unauthorized"), 401);
  }

  const parsed = emailPayloadSchema.safeParse(await readJson(request));

  if (!parsed.success) {
    return jsonError(t("api.settings.invalidEmail"));
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
    return jsonError(getApiErrorMessage(error, t("api.common.generic")));
  }

  return NextResponse.json({
    ok: true,
    message: t("api.settings.emailConfirmationSent"),
  });
}
