import { NextResponse } from "next/server";

import { getHomeEvents } from "@/entities/events";

export async function GET() {
  const homeEvents = await getHomeEvents();

  return NextResponse.json({ events: homeEvents });
}
