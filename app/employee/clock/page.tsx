import type { Metadata } from "next";
import { ClockScreen } from "@/components/employee/clock-screen";

export const metadata: Metadata = { title: "Clock in/out" };

export default function ClockPage() {
  return <ClockScreen />;
}
