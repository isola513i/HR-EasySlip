import type { Metadata } from "next";
import { LeaveCalendarScreen } from "@/components/employee/leave-calendar/leave-calendar-screen";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary(await getLocale());
  return { title: t.metadata.pageTitles.leaveCalendar };
}

export default function MyLeaveCalendarPage() {
  return <LeaveCalendarScreen />;
}
