import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VERSION = process.env.npm_package_version ?? "0.1.0";

export async function GET() {
  let db: "ok" | "error" = "ok";
  let failedOutboxEvents = 0;

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    db = "error";
  }

  try {
    failedOutboxEvents = await prisma.payrollOutboxEvent.count({
      where: { status: "FAILED" },
    });
  } catch {
    // If DB is down, count fails too — already captured by db check
  }

  const status = db === "error" || failedOutboxEvents > 0 ? "degraded" : "ok";

  return NextResponse.json({
    status,
    version: VERSION,
    db,
    failedOutboxEvents,
    uptimeSec: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}
