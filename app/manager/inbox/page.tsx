import type { Metadata } from "next";
import { ApprovalInbox } from "@/components/manager/approval-inbox";

export const metadata: Metadata = { title: "Approval Inbox" };

export default function ManagerInboxPage() {
  return <ApprovalInbox />;
}
