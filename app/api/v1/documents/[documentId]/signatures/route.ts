import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk, apiError } from "@/lib/api/response";
import { requireApiEmployee, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { getDocumentSignatures } from "@/lib/documents/signature-service";
import { prisma } from "@/lib/prisma";
import { canRead } from "@/lib/documents/rbac";

export const GET = withApiHandler(async (_req, ctx) => {
  const caller = await requireApiEmployee(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const doc = await prisma.document.findUnique({
    where: { id: ctx.params.documentId },
    select: { ownerEmployeeId: true, category: true },
  });
  if (!doc) return apiError("NOT_FOUND", "document not found", 404);

  const allowed = await canRead(
    { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
    { ownerEmployeeId: doc.ownerEmployeeId, category: doc.category },
  );
  if (!allowed) return apiError("FORBIDDEN", "not authorized", 403);

  const signatures = await getDocumentSignatures(ctx.params.documentId);
  return apiOk(signatures);
});
