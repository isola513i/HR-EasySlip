import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { requireApiRoles, HR_ROLES } from "@/lib/security/rbac";
import { generateTimestampExport } from "@/lib/payroll/empeo-formatter";

const EXPORT_ROLES = ["HR_AUTHORIZED", ...HR_ROLES] as const;

export const POST = withApiHandler(async (_req, ctx) => {
  const caller = await requireApiRoles(EXPORT_ROLES);
  if (caller instanceof NextResponse) return caller;

  const csv = await generateTimestampExport(ctx.params.id);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="timestamps-${ctx.params.id}.csv"`,
    },
  });
});

export const GET = withApiHandler(async (_req, ctx) => {
  const caller = await requireApiRoles(EXPORT_ROLES);
  if (caller instanceof NextResponse) return caller;

  const csv = await generateTimestampExport(ctx.params.id);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="timestamps-${ctx.params.id}.csv"`,
    },
  });
});
