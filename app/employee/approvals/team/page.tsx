import type { Metadata } from "next";
import { TeamDashboard } from "@/components/manager/team-dashboard";

export const metadata: Metadata = { title: "Team Today" };

export default function ApprovalsTeamPage() {
  return <TeamDashboard />;
}
