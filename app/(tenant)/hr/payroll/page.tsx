import type { Metadata } from "next";
import { PayrollDashboard } from "@/components/hr/payroll-dashboard";

export const metadata: Metadata = { title: "Payroll Export — EasySlip HR" };

export default function PayrollPage() {
  return <PayrollDashboard />;
}
