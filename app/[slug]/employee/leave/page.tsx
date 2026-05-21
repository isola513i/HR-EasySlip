import { LeaveScreen } from "@/components/employee/leave-screen";
import { pageMetadata } from "@/lib/i18n/page-metadata";

export const generateMetadata = () => pageMetadata("leave");

export default function LeavePage() {
  return <LeaveScreen />;
}
