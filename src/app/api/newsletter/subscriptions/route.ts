import { NextResponse } from "next/server";
import { z } from "zod";

import { getRequestLocaleFromRequest, getRequestTranslatorFromRequest } from "@/shared/i18n/server";
import { subscribeToNewsletter } from "@/shared/server/newsletter/subscriptions";

const subscriptionPayloadSchema = z.object({
  age: z.coerce.number().int().min(18).max(80),
  email: z.string().trim().email().max(254),
  firstName: z.string().trim().min(1).max(80),
  gender: z.enum(["female", "male", "other"]),
});

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const t = getRequestTranslatorFromRequest(request);
  const parsed = subscriptionPayloadSchema.safeParse(await readJson(request));

  if (!parsed.success) {
    return NextResponse.json({ error: t("api.newsletter.invalidPayload") }, { status: 400 });
  }

  try {
    const subscription = await subscribeToNewsletter({
      ...parsed.data,
      locale: getRequestLocaleFromRequest(request),
      source: "home_waitlist",
    });

    return NextResponse.json({
      ok: true,
      subscription,
    });
  } catch {
    return NextResponse.json({ error: t("api.common.generic") }, { status: 500 });
  }
}
