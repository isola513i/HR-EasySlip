import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { DashboardScreen } from "@/components/hr/dashboard/dashboard-screen";

export const metadata: Metadata = { title: "HR Dashboard" };

export default async function HROverviewPage() {
  const session = await auth();
  const firstName = session?.user?.employee?.firstNameTh ?? "";
  return <DashboardScreen firstName={firstName} />;
}
