import type { Metadata } from "next";
import { InboxTabs } from "@/components/manager/inbox-tabs";

export const metadata: Metadata = { title: "Approval Inbox" };

export default function ManagerInboxPage() {
  return <InboxTabs />;
}
