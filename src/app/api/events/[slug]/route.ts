import { NextResponse } from "next/server";

import { getEventBySlug } from "@/entities/events";
import { getRequestTranslatorFromRequest } from "@/shared/i18n/server";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const t = getRequestTranslatorFromRequest(request);
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    return NextResponse.json({ error: t("api.events.notFound") }, { status: 404 });
  }

  return NextResponse.json({ event });
}
