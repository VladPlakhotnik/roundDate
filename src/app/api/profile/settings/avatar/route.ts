import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/shared/server/db/client";
import { authUsers } from "@/shared/server/db/schema";

import { getSettingsSession, getSettingsTranslator, jsonError } from "../_utils";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const t = getSettingsTranslator(request);
  const session = await getSettingsSession(request);

  if (!session?.user) {
    return jsonError(t("api.common.unauthorized"), 401);
  }

  const formData = await request.formData();
  const file = formData.get("avatar");

  if (!(file instanceof File)) {
    return jsonError(t("api.settings.avatarMissing"));
  }

  if (!allowedImageTypes.has(file.type)) {
    return jsonError(t("api.settings.avatarUnsupported"));
  }

  if (file.size > MAX_AVATAR_SIZE) {
    return jsonError(t("api.settings.avatarTooLarge"));
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const image = `data:${file.type};base64,${buffer.toString("base64")}`;

  await getDb()
    .update(authUsers)
    .set({ image, updatedAt: new Date() })
    .where(eq(authUsers.id, session.user.id));

  return NextResponse.json({ image, ok: true });
}
