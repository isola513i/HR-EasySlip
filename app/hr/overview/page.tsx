import type { Metadata } from "next";
import { HROverview } from "@/components/hr/hr-overview";

export const metadata: Metadata = { title: "HR Overview" };

export default function HROverviewPage() {
  return <HROverview />;
}
