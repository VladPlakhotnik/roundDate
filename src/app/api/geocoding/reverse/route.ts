import { NextResponse } from "next/server";

import { requireAdmin } from "@/admin/auth/require-admin";
import {
  normalizeReverseGeocodeResult,
  type NominatimReverseGeocodeResult,
} from "@/admin/server/reverse-geocode";

export const dynamic = "force-dynamic";

const reverseGeocodeUrl = "https://nominatim.openstreetmap.org/reverse";

function readCoordinate(value: string | null, min: number, max: number) {
  const coordinate = Number(value);

  if (!Number.isFinite(coordinate) || coordinate < min || coordinate > max) {
    return undefined;
  }

  return coordinate;
}

export async function GET(request: Request) {
  await requireAdmin();

  const requestUrl = new URL(request.url);
  const latitude = readCoordinate(requestUrl.searchParams.get("lat"), -90, 90);
  const longitude = readCoordinate(requestUrl.searchParams.get("lon"), -180, 180);

  if (latitude === undefined || longitude === undefined) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const url = new URL(reverseGeocodeUrl);
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("zoom", "18");

  const email = process.env.NOMINATIM_EMAIL?.trim();

  if (email) {
    url.searchParams.set("email", email);
  }

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "ru,pl,en",
      "User-Agent": "RoundDateAdmin/0.1 reverse-geocoding",
    },
    next: { revalidate: 2_592_000 },
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Reverse geocoding failed" }, { status: 502 });
  }

  const result = (await response.json()) as NominatimReverseGeocodeResult;

  return NextResponse.json(normalizeReverseGeocodeResult(result));
}
