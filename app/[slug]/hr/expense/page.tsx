import type { Metadata } from "next";
import { ExpenseDashboard } from "@/components/hr/expense/expense-dashboard";

export const metadata: Metadata = { title: "Expenses — EasySlip HR" };

export default function HrExpensePage() {
  return <ExpenseDashboard />;
}
