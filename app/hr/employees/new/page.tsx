import type { Metadata } from "next";
import { NewEmployeeView } from "@/components/hr/new-employee-view";

export const metadata: Metadata = { title: "Add Employee" };

export default function NewEmployeePage() {
  return <NewEmployeeView />;
}
