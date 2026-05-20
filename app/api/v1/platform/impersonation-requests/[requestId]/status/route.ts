import { NextRequest, NextResponse } from "next/server";
import { getControlPlane } from "@/lib/db/control-plane";
import { requirePlatformSession } from "@/lib/auth/platform";
import { PLATFORM_ADMIN_ROLES } from "@/lib/security/platform-rbac";

interface Params {
  params: Promise<{ requestId: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await requirePlatformSession(PLATFORM_ADMIN_ROLES).catch(() => null);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { requestId } = await params;
  const cp = getControlPlane();

  const request = await cp.impersonationRequest.findUnique({
    where: { id: requestId },
    select: { status: true, platformUserId: true },
  });

  if (!request || request.platformUserId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ status: request.status });
}
