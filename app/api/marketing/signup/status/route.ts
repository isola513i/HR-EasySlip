import { type NextRequest, NextResponse } from "next/server";
import { apiOk, apiError } from "@/lib/api/response";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const signupId = req.nextUrl.searchParams.get("id");
  if (!signupId) return apiError("MISSING_ID", "Missing signup id", 400);

  if (!process.env.CONTROL_PLANE_DATABASE_URL) {
    return apiError("NOT_AVAILABLE", "Control plane not configured", 503);
  }

  const { getControlPlane } = await import("@/lib/db/control-plane");
  const cp = getControlPlane();

  const signup = await cp.trialSignup.findUnique({
    where: { id: signupId },
    select: {
      status: true,
      desiredSlug: true,
      provisioningError: true,
    },
  });

  if (!signup) return apiError("NOT_FOUND", "Signup not found", 404);

  return apiOk({
    status: signup.status,
    slug: signup.status === "READY" ? signup.desiredSlug : null,
    error: signup.provisioningError ?? null,
  });
}
