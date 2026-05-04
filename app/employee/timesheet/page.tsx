import type { Metadata } from "next";
import { TimesheetScreen } from "@/components/employee/timesheet-screen";

export const metadata: Metadata = { title: "My Timesheet" };

export default function TimesheetPage() {
  return <TimesheetScreen />;
}
