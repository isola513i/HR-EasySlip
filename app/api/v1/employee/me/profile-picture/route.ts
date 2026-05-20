import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { requireApiEmployee } from "@/lib/security/rbac";
import { EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { parseMultipart } from "@/lib/api/parse-multipart";
import {
  uploadProfilePicture,
  deleteProfilePicture,
  PROFILE_PICTURE_MAX_BYTES,
  PROFILE_PICTURE_ALLOWED,
} from "@/lib/employee/profile-picture-service";
import { requireApiMutable } from "@/lib/auth/impersonation-guard";

export const PUT = withApiHandler(async (req, ctx) => {
  const guard = await requireApiMutable();
  if (guard) return guard;

  const caller = await requireApiEmployee(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const { file } = await parseMultipart(req, {
    fileField: "image",
    requireFile: true,
    maxBytes: PROFILE_PICTURE_MAX_BYTES,
    allowedMime: PROFILE_PICTURE_ALLOWED,
  });

  const result = await uploadProfilePicture({
    actorUserId: caller.userId,
    employeeId: caller.employeeId,
    file: file!,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return apiOk(result);
});

export const DELETE = withApiHandler(async (req, ctx) => {
  const guard = await requireApiMutable();
  if (guard) return guard;

  const caller = await requireApiEmployee(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  await deleteProfilePicture({
    actorUserId: caller.userId,
    employeeId: caller.employeeId,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return apiOk({ ok: true });
});
