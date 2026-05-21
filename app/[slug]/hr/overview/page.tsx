import type { Metadata } from "next";
import { requireRoles, HR_ROLES } from "@/lib/security/rbac";
import { DashboardScreen } from "@/components/hr/dashboard/dashboard-screen";

export const metadata: Metadata = { title: "HR Dashboard" };

export default async function HROverviewPage() {
  const { firstNameTh } = await requireRoles(HR_ROLES);
  return <DashboardScreen firstName={firstNameTh ?? ""} />;
}
