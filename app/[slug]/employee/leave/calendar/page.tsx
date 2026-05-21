import { LeaveCalendarScreen } from "@/components/employee/leave-calendar/leave-calendar-screen";
import { pageMetadata } from "@/lib/i18n/page-metadata";

export const generateMetadata = () => pageMetadata("leaveCalendar");

export default function MyLeaveCalendarPage() {
  return <LeaveCalendarScreen />;
}
