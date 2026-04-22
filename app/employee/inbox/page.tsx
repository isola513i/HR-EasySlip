import type { Metadata } from "next";
import { InboxScreen } from "@/components/employee/inbox-screen";

export const metadata: Metadata = { title: "Inbox" };

export default function InboxPage() {
  return <InboxScreen />;
}
