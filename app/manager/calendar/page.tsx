import type { Metadata } from "next";
import { ManagerCalendarView } from "@/components/manager/manager-calendar-view";

export const metadata: Metadata = { title: "Leave Calendar" };

export default function ManagerCalendarPage() {
  return <ManagerCalendarView />;
}
