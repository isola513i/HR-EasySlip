import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { InboxTabs } from "@/components/manager/inbox-tabs";

export const metadata: Metadata = { title: "Approvals" };

export default function ApprovalsPage() {
  return (
    <div className="flex min-h-full flex-col">
      <div className="flex items-center justify-between px-4 pb-2 pt-6">
        <h1 className="text-xl font-bold">Approvals</h1>
        <Link
          href="/employee/approvals/team"
          className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:bg-muted/80"
          aria-label="Team today"
        >
          <Users className="size-4" />
          Team
        </Link>
      </div>
      <div className="flex-1 px-4 pb-4">
        <InboxTabs />
      </div>
    </div>
  );
}
