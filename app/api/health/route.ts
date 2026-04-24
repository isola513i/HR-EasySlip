import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  let db: "ok" | "error" = "ok";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    db = "error";
  }

  const status = db === "error" ? "degraded" : "ok";

  return NextResponse.json({
    status,
    timestamp: new Date().toISOString(),
  });
}
