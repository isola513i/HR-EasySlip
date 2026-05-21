import { NextRequest, NextResponse } from "next/server";
import { SLUG_RE } from "@/lib/validation/trial-signup";
import { isReservedSlug } from "@/lib/tenant/reserved-slugs";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug")?.toLowerCase().trim();

  if (!slug) return NextResponse.json({ available: false, reason: "MISSING" });
  if (!SLUG_RE.test(slug)) return NextResponse.json({ available: false, reason: "INVALID_FORMAT" });
  if (isReservedSlug(slug)) return NextResponse.json({ available: false, reason: "RESERVED" });

  // Check Control Plane DB if configured
  if (process.env.CONTROL_PLANE_DATABASE_URL) {
    try {
      const { getControlPlane } = await import("@/lib/db/control-plane");
      const cp = getControlPlane();
      const existing = await cp.tenant.findUnique({ where: { slug }, select: { id: true } });
      if (existing) return NextResponse.json({ available: false, reason: "TAKEN" });
    } catch {
      // DB unavailable — allow optimistic response; server validates on submit
    }
  }

  return NextResponse.json({ available: true });
}
