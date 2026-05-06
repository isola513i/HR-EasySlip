import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiError } from "@/lib/api/response";
import { requireApiRoles } from "@/lib/security/rbac";
import { EMPLOYEE_ROLES, HR_ROLES, MANAGER_ROLES } from "@/lib/security/rbac";
import { streamProfilePicture } from "@/lib/employee/profile-picture-service";
import { StorageError } from "@/lib/storage/blob";
import { DomainError } from "@/lib/api/errors";

const ALL_AUTH_ROLES = [...new Set([...EMPLOYEE_ROLES, ...HR_ROLES, ...MANAGER_ROLES])];

export const GET = withApiHandler(async (_req, ctx) => {
  const caller = await requireApiRoles(ALL_AUTH_ROLES);
  if (caller instanceof NextResponse) return caller;

  const employeeId = ctx.params.employeeId;
  if (!employeeId) return apiError("INVALID_PARAM", "employeeId is required", 400);

  try {
    const blob = await streamProfilePicture(employeeId);
    return new NextResponse(blob.body, {
      status: 200,
      headers: {
        "Content-Type": blob.contentType,
        "Content-Length": String(blob.size || 0),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    if (err instanceof DomainError && err.code === "PROFILE_PICTURE_NOT_FOUND") {
      return apiError("NOT_FOUND", "no profile picture", 404);
    }
    if (err instanceof StorageError && err.code === "STORAGE_NOT_FOUND") {
      return apiError("NOT_FOUND", "blob not found", 404);
    }
    throw err;
  }
});
