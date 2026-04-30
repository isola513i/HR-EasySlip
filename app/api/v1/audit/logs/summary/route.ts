import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseSearchParams } from "@/lib/api/validate";
import { requireApiRoles } from "@/lib/security/rbac";
import { AuditQuerySchema } from "@/lib/audit/schemas";
import { getAuditSummary } from "@/lib/audit/audit-service";

const AUDIT_ROLES = ["HRMG", "ADMIN"] as const;

export const GET = withApiHandler(async (req) => {
  const caller = await requireApiRoles(AUDIT_ROLES);
  if (caller instanceof NextResponse) return caller;

  const filters = parseSearchParams(req, AuditQuerySchema);
  const summary = await getAuditSummary(filters);
  return apiOk(summary);
});
