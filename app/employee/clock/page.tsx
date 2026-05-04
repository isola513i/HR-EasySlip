import { ClockScreen } from "@/components/employee/clock-screen";
import { pageMetadata } from "@/lib/i18n/page-metadata";

export const generateMetadata = () => pageMetadata("clock");

export default function ClockPage() {
  return <ClockScreen />;
}
