"use client";

import { ShieldCheck } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DocumentListItem } from "@/components/shared/document-list-item";
import { useEntityDocuments } from "@/hooks/use-documents";
import { formatLeaveType } from "@/lib/utils";
import { useT } from "@/lib/i18n/locale-context";
import { useFormat } from "@/hooks/use-format";
import type { ApprovalRow } from "@/types/manager";

interface Props {
  row: ApprovalRow | null;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function DetailSheet({ row, onClose, onApprove, onReject }: Props) {
  const t = useT();
  const fmt = useFormat();
  // Hooks must run unconditionally — pass entityId regardless of `row` and
  // bail out below. The hook short-circuits to empty when entityId is null.
  const { documents } = useEntityDocuments({
    entityType: "LeaveRequest",
    entityId: row?.id ?? null,
  });

  if (!row) return null;

  const name = `${row.employee.firstNameTh} ${row.employee.lastNameTh}`;
  const leaveType = formatLeaveType(row.leaveType);
  const halfDayLabel = row.halfDay === "FULL" ? t.manager.fullDay : t.manager.halfDay;
  const fields: Array<readonly [string, string]> = [
    [t.manager.type, leaveType],
    [t.manager.dates, `${fmt.formatShortDate(row.startDate, "numeric")} – ${fmt.formatShortDate(row.endDate, "numeric")}`],
    [t.manager.duration, `${row.daysRequested} ${t.common.days} (${halfDayLabel})`],
    [t.manager.reason, row.reason],
    [t.manager.submitted, fmt.formatShortDate(row.createdAt, "numeric")],
  ];

  return (
    <Sheet open={!!row} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-[min(95vw,480px)] sm:max-w-[480px]">
        <SheetHeader>
          <SheetTitle>{t.manager.leaveRequestTitle}</SheetTitle>
          <SheetDescription className="sr-only">{name}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-auto px-4 pb-4">
          <div className="flex items-center gap-3 border-b border-[var(--es-neutral-100)] py-3">
            <div className="es-brand-gradient grid size-11 place-items-center rounded-full font-bold text-white">
              {row.employee.firstNameTh.charAt(0)}
            </div>
            <div>
              <div className="font-semibold">{name}</div>
              <div className="text-xs text-muted-foreground">
                {row.employee.employeeCode} · {t.manager.directReport}
              </div>
            </div>
          </div>

          {fields.map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-[var(--es-neutral-100)] py-2.5 text-[13px]">
              <span className="text-muted-foreground">{k}</span>
              <span className="max-w-[60%] text-right font-medium">{v}</span>
            </div>
          ))}

          <div className="my-4 flex gap-2.5 rounded-lg border border-border bg-[var(--es-neutral-50)] p-3.5">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="text-[13px] leading-relaxed">
              <div className="font-semibold">{t.manager.requestInfo}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {t.manager.requestInfoSummary
                  .replace("{days}", String(row.daysRequested))
                  .replace("{type}", leaveType)}
              </div>
            </div>
          </div>

          {documents.length > 0 && (
            <div className="mb-4 space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t.documents.category.leave_attachment}
              </div>
              <div className="space-y-2">
                {documents.map((doc) => (
                  <DocumentListItem key={doc.id} document={doc} canDelete={false} />
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => { onReject(row.id); onClose(); }}
              className="flex-1 rounded-md border border-[var(--es-error-500)] bg-card py-3 text-sm font-semibold text-[var(--es-error-500)] transition-colors hover:bg-[var(--es-error-50)]"
            >
              {t.manager.reject}
            </button>
            <button
              onClick={() => { onApprove(row.id); onClose(); }}
              className="flex-[2] rounded-md bg-[var(--es-success-600)] py-3 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(22,163,74,0.2)] transition-colors hover:bg-[var(--es-success-700)]"
            >
              {t.manager.approveRequest}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
