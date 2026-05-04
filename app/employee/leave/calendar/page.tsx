import type { Metadata } from "next";
import { LeaveCalendarScreen } from "@/components/employee/leave-calendar/leave-calendar-screen";

export const metadata: Metadata = { title: "My Leave Calendar" };

export default function MyLeaveCalendarPage() {
  return <LeaveCalendarScreen />;
}
