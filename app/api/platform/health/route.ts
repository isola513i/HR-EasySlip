export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getPlatformSession } from "@/lib/auth/platform";
import { PLATFORM_VIEWER_ROLES } from "@/lib/security/platform-rbac";
import { getCacheStats } from "@/lib/db/tenant";

export async function GET(): Promise<NextResponse> {
  // Allow CRON_SECRET bearer OR a valid platform session
  const session = await getPlatformSession();
  if (!session || !PLATFORM_VIEWER_ROLES.includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cache = getCacheStats();

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    connectionPool: {
      activeTenants: cache.size,
      maxTenants: cache.maxClients,
      idleTtlMinutes: cache.idleTtlMs / 60_000,
      utilizationPct: Math.round((cache.size / cache.maxClients) * 100),
      entries: cache.entries,
    },
  });
}
