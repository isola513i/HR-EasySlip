import type { Metadata } from "next";
import { TimesheetScreen } from "@/components/employee/timesheet-screen";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary(await getLocale());
  return { title: t.metadata.pageTitles.timesheet };
}

export default function TimesheetPage() {
  return <TimesheetScreen />;
}
