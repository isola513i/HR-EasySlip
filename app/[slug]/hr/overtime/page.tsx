import type { Metadata } from "next";
import { requireRoles, HR_ROLES } from "@/lib/security/rbac";
import { OvertimeOverview } from "@/components/hr/overtime-overview";

export const metadata: Metadata = { title: "Overtime" };

export default async function HrOvertimePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await requireRoles(HR_ROLES, slug);
  return <OvertimeOverview />;
}
