import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { requireApiRoles, HR_ROLES } from "@/lib/security/rbac";
import { generateTimestampExport } from "@/lib/payroll/empeo-formatter";
import { findPendingExportEvent, markOutboxConsumed, markOutboxFailed } from "@/lib/payroll/outbox-processor";
import { requireApiMutable } from "@/lib/auth/impersonation-guard";

const EXPORT_ROLES = ["HR_AUTHORIZED", ...HR_ROLES] as const;

const handleExport = withApiHandler(async (_req, ctx) => {
  const caller = await requireApiRoles(EXPORT_ROLES);
  if (caller instanceof NextResponse) return caller;

  const cycleId = ctx.params.id;
  const event = await findPendingExportEvent(cycleId, "cycle.locked");

  let csv: string;
  try {
    csv = await generateTimestampExport(cycleId);
    if (event) await markOutboxConsumed(event.id);
  } catch (err) {
    if (event) await markOutboxFailed(event.id, err instanceof Error ? err.message : "Unknown error");
    throw err;
  }

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="timestamps-${cycleId}.csv"`,
    },
  });
});

export const POST = handleExport;
export const GET = handleExport;
