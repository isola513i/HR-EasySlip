export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getControlPlane } from "@/lib/db/control-plane";

// Vercel Cron: runs daily at 00:05 UTC
// vercel.json: { "crons": [{ "path": "/api/platform/cron/trial-expiry", "schedule": "5 0 * * *" }] }
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[cron/trial-expiry] CRON_SECRET not set — endpoint is unprotected");
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cp = getControlPlane();
  const now = new Date();

  const { count } = await cp.tenant.updateMany({
    where: { status: "TRIAL", trialEndsAt: { lt: now } },
    data: { status: "TRIAL_EXPIRED" },
  });

  console.log(`[cron/trial-expiry] expired ${count} tenant(s) at ${now.toISOString()}`);
  return NextResponse.json({ expired: count, at: now.toISOString() });
}
