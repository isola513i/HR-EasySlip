import { TimesheetScreen } from "@/components/employee/timesheet-screen";
import { pageMetadata } from "@/lib/i18n/page-metadata";

export const generateMetadata = () => pageMetadata("timesheet");

export default function TimesheetPage() {
  return <TimesheetScreen />;
}
