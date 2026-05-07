import type { Metadata } from "next";
import { OrgChartView } from "@/components/hr/org-chart-view";

export const metadata: Metadata = { title: "Org Chart — EasySlip HR" };

export default function OrgChartPage() {
  return <OrgChartView />;
}
