import { NextResponse } from "next/server";

import { requireAdmin } from "@/admin/auth/require-admin";
import {
  getAdminDiscoverySourceStats,
  normalizeAdminDiscoverySourcePeriod,
} from "@/admin/server/dashboard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await requireAdmin();

  const requestUrl = new URL(request.url);
  const period = normalizeAdminDiscoverySourcePeriod(requestUrl.searchParams.get("period"));

  try {
    return NextResponse.json(await getAdminDiscoverySourceStats(period));
  } catch (error) {
    console.error("Failed to load admin discovery source stats", error);

    return NextResponse.json(
      { error: "Failed to load discovery source stats" },
      { status: 500 },
    );
  }
}
