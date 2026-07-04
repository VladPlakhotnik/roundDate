import { NextResponse } from "next/server";

import { cancelUserBooking } from "@/entities/events/server/user-payments";
import { getRequestTranslatorFromRequest } from "@/shared/i18n/server";

type RouteContext = {
  params: Promise<{
    bookingId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const t = getRequestTranslatorFromRequest(request);
  const { bookingId } = await context.params;
  const result = await cancelUserBooking({
    bookingId,
    headers: request.headers,
    t,
  });

  if ("error" in result) {
    const { error, status } = result;

    return NextResponse.json({ error }, { status });
  }

  const { cancelled, refunded, status } = result;

  return NextResponse.json({ cancelled, refunded }, { status });
}
