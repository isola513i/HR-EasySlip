import type { Metadata } from "next";
import { LeaveScreen } from "@/components/hr/leave/leave-screen";

export const metadata: Metadata = { title: "Leave Management — EasySlip HR" };

export default function HrLeavePage() {
  return <LeaveScreen />;
}
