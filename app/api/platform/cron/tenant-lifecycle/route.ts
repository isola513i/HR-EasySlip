export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { tenantLifecycleTick } from "@/lib/platform/tenant-lifecycle-service";

// Vercel Cron: runs daily at 00:10 UTC
// vercel.json: { "crons": [{ "path": "/api/platform/cron/tenant-lifecycle", "schedule": "10 0 * * *" }] }
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[cron/tenant-lifecycle] CRON_SECRET not set");
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await tenantLifecycleTick();
  console.log(`[cron/tenant-lifecycle] suspended=${result.suspended} softDeleted=${result.softDeleted} hardDeleted=${result.hardDeleted}`);
  return NextResponse.json({ ...result, at: new Date().toISOString() });
}
