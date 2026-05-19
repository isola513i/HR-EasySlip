import type { Metadata } from "next";
import { EmployeeDirectory } from "@/components/hr/employee-directory";

export const metadata: Metadata = { title: "Employee Directory" };

export default function EmployeesPage() {
  return <EmployeeDirectory />;
}
