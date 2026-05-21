import type { Metadata } from "next";
import { requireRoles, HR_ROLES } from "@/lib/security/rbac";
import { DashboardScreen } from "@/components/hr/dashboard/dashboard-screen";

export const metadata: Metadata = { title: "HR Dashboard" };

export default async function HROverviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { firstNameTh } = await requireRoles(HR_ROLES, slug);
  return <DashboardScreen firstName={firstNameTh ?? ""} />;
}
