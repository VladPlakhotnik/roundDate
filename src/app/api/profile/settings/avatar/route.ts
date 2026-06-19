import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/shared/server/db/client";
import { authUsers } from "@/shared/server/db/schema";

import { getSettingsSession, jsonError } from "../_utils";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const session = await getSettingsSession(request);

  if (!session?.user) {
    return jsonError("Unauthorized", 401);
  }

  const formData = await request.formData();
  const file = formData.get("avatar");

  if (!(file instanceof File)) {
    return jsonError("Добавьте файл изображения.");
  }

  if (!allowedImageTypes.has(file.type)) {
    return jsonError("Поддерживаются только JPG, PNG и WebP.");
  }

  if (file.size > MAX_AVATAR_SIZE) {
    return jsonError("Загрузите изображение до 2 МБ.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const image = `data:${file.type};base64,${buffer.toString("base64")}`;

  await getDb()
    .update(authUsers)
    .set({ image, updatedAt: new Date() })
    .where(eq(authUsers.id, session.user.id));

  return NextResponse.json({ image, ok: true });
}
