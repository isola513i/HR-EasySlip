"use client";

import { LeaveQuotaCards } from "@/components/hr/leave/leave-quota-cards";
import { PendingApprovalsList } from "@/components/hr/leave/pending-approvals-list";
import { LeaveMonthCalendar } from "@/components/hr/leave/leave-month-calendar";
import { useLeaveManagement } from "@/hooks/use-leave-management";
import { useT } from "@/lib/i18n/locale-context";

export function LeaveScreen() {
  const t = useT();
  const { stats, pending, isLoading, approve, reject } = useLeaveManagement();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.hr.leave.title}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{t.hr.leave.subtitle}</p>
      </div>

      <LeaveQuotaCards stats={stats} isLoading={isLoading} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
        <PendingApprovalsList rows={pending} isLoading={isLoading} approve={approve} reject={reject} />
        <LeaveMonthCalendar />
      </div>
    </div>
  );
}
