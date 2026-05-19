import type { Metadata } from "next";
import { CashoutDashboard } from "@/components/hr/payroll/cashout-dashboard";

export const metadata: Metadata = { title: "Annual Leave Cashout — EasySlip HR" };

export default function CashoutPage() {
  return <CashoutDashboard />;
}
