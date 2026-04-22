import type { Metadata } from "next";
import { LeaveScreen } from "@/components/employee/leave-screen";

export const metadata: Metadata = { title: "Leave request" };

export default function LeavePage() {
  return <LeaveScreen />;
}
