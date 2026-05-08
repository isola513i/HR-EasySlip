import type { Metadata } from "next";
import { ExpenseScreen } from "@/components/employee/expense/expense-screen";

export const metadata: Metadata = { title: "Expenses — EasySlip HR" };

export default function EmployeeExpensePage() {
  return <ExpenseScreen />;
}
