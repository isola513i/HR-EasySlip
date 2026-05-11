"use client";

import { useState } from "react";
import { Calendar, CheckCircle2, Clock, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EmployeeAvatar } from "@/components/hr/attendance/employee-avatar";
import { useT } from "@/lib/i18n/locale-context";
import { useFormat } from "@/hooks/use-format";
import { getInitials } from "@/lib/employee/initials";
import type { PendingLeaveRow } from "@/lib/leave/leave-org-stats-service";

interface Props {
  row: PendingLeaveRow | null;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export function ApproveLeaveDialog({ row, onClose, onConfirm }: Props) {
  const t = useT();
  const fmt = useFormat();
  const [loading, setLoading] = useState(false);

  if (!row) return null;

  const name = `${row.employee.firstNameTh} ${row.employee.lastNameTh}`;
  const initials = getInitials(row.employee);
  const typeLabel =
    (t.leave[row.leaveType.toLowerCase() as keyof typeof t.leave] as string | undefined) ?? row.leaveType;

  const handle = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && !loading && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.hr.leave.confirmApproveTitle}</DialogTitle>
          <DialogDescription>{t.hr.leave.approveDialogSubtitle}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 rounded-lg border border-border bg-(--es-neutral-50) p-3">
          <EmployeeAvatar seed={row.employee.employeeCode} initials={initials} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-semibold">{name}</div>
            <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground">
              <span className="font-mono">{row.employee.employeeCode}</span>
              <span>·</span>
              <span className="rounded-full bg-(--es-accent-50) px-2 py-0.5 text-[11px] font-medium text-(--es-accent-700)">
                {typeLabel}
              </span>
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2.5 text-[13px]">
          <dt className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="size-3.5" />
            {t.hr.leave.approveDialogPeriod}
          </dt>
          <dd className="tabular-nums text-right font-medium">
            {fmt.formatShortDate(row.startDate, "numeric")} – {fmt.formatShortDate(row.endDate, "numeric")}
          </dd>

          <dt className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="size-3.5" />
            {t.hr.leave.approveDialogDuration}
          </dt>
          <dd className="tabular-nums text-right font-semibold">
            {row.daysRequested} {t.hr.leave.daysUnit}
          </dd>

          {row.reason && (
            <>
              <dt className="flex items-center gap-1.5 pt-0.5 text-muted-foreground">
                <Info className="size-3.5" />
                {t.hr.leave.approveDialogReason}
              </dt>
              <dd className="text-right">{row.reason}</dd>
            </>
          )}
        </dl>

        <div className="flex items-start gap-2.5 rounded-lg border border-(--es-success-200,#bbf7d0) bg-(--es-success-50) p-3 text-[12px] text-(--es-success-700)">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <span>
            {t.hr.leave.approveDialogPolicy
              .replace("{days}", String(row.daysRequested))
              .replace("{type}", typeLabel)}
          </span>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t.common.cancel}
          </Button>
          <Button variant="success" onClick={handle} disabled={loading} className="gap-1.5">
            <CheckCircle2 className="size-4" />
            {loading ? t.common.saving : t.manager.approve}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
