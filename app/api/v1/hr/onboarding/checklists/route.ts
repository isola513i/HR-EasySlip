import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { requireApiEmployee, HR_ROLES } from "@/lib/security/rbac";
import { listChecklistsWithProgress } from "@/lib/onboarding/checklist-service";

export const GET = withApiHandler(async (req) => {
  const caller = await requireApiEmployee(HR_ROLES);
  if (caller instanceof NextResponse) return caller;

  const completed = req.nextUrl.searchParams.get("completed");
  const filter = completed !== null ? { completed: completed === "true" } : undefined;

  return apiOk(await listChecklistsWithProgress(filter));
});
