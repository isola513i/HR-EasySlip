import { NextResponse } from "next/server";
import { getControlPlane } from "@/lib/db/control-plane";

export async function GET() {
  let db: "ok" | "error" = "ok";

  try {
    const cp = getControlPlane();
    await cp.$queryRaw`SELECT 1`;
  } catch {
    db = "error";
  }

  const status = db === "error" ? "degraded" : "ok";

  return NextResponse.json({
    status,
    timestamp: new Date().toISOString(),
  });
}
