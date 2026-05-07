"use client";

import type { MouseEvent } from "react";
import { Check, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusPill } from "@/components/shared/status-pill";
import { cn, formatLeaveType } from "@/lib/utils";
import { useT } from "@/lib/i18n/locale-context";
import { useFormat } from "@/hooks/use-format";
import type { ApprovalRow } from "@/types/manager";

interface Props {
  row: ApprovalRow;
  selected: boolean;
  exiting: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onApprove: () => void;
  onReject: () => void;
}

const stop = (e: MouseEvent) => e.stopPropagation();

const exitClasses =
  "data-[exiting]:animate-out data-[exiting]:fade-out data-[exiting]:slide-out-to-right data-[exiting]:duration-200 data-[exiting]:fill-mode-forwards data-[exiting]:pointer-events-none";

export function ApprovalRowMobile({ row: r, selected, exiting, onSelect, onToggle, onApprove, onReject }: Props) {
  const t = useT();
  const fmt = useFormat();
  const name = `${r.employee.firstNameTh} ${r.employee.lastNameTh}`;
  return (
    <div
      onClick={() => !exiting && onSelect()}
      data-exiting={exiting || undefined}
      className={cn(
        "cursor-pointer rounded-xl border border-border bg-card p-3 shadow-[var(--es-shadow-sm)] transition-colors",
        exitClasses,
        selected && "bg-[var(--es-accent-50)]",
      )}
    >
      <div className="flex items-start gap-2">
        <span onClick={stop} className="pt-0.5">
          <Checkbox checked={selected} onCheckedChange={onToggle} aria-label={t.manager.selectAriaOne.replace("{name}", name)} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{name}</div>
          <div className="font-mono text-[11px] text-muted-foreground">{r.employee.employeeCode}</div>
        </div>
        <div className="flex shrink-0 gap-0.5">
          <button title={t.manager.approve} aria-label={`${t.manager.approve} ${name}`} onClick={(e) => { stop(e); onApprove(); }} className="rounded-md p-2 text-[var(--es-success-600)] transition-colors hover:bg-[var(--es-success-50)]">
            <Check className="size-4" />
          </button>
          <button title={t.manager.reject} aria-label={`${t.manager.reject} ${name}`} onClick={(e) => { stop(e); onReject(); }} className="rounded-md p-2 text-[var(--es-error-500)] transition-colors hover:bg-[var(--es-error-50)]">
            <X className="size-4" />
          </button>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
        <span className="font-medium">{formatLeaveType(r.leaveType)}</span>
        {r.hasAttachment && <StatusPill tone="info" dot={false}>PDF</StatusPill>}
        <span className="text-muted-foreground">·</span>
        <span className="tabular-nums font-semibold">{r.daysRequested}</span>
        <span className="text-muted-foreground">{t.manager.daysCol}</span>
      </div>
      <div className="mt-1.5 text-xs">
        {fmt.formatShortDate(r.startDate)} – {fmt.formatShortDate(r.endDate)}
      </div>
      {r.reason && <div className="mt-1 truncate text-[11px] text-muted-foreground">{r.reason}</div>}
    </div>
  );
}

export function ApprovalRowDesktop({ row: r, selected, exiting, onSelect, onToggle, onApprove, onReject }: Props) {
  const t = useT();
  const fmt = useFormat();
  const name = `${r.employee.firstNameTh} ${r.employee.lastNameTh}`;
  return (
    <div
      onClick={() => !exiting && onSelect()}
      data-exiting={exiting || undefined}
      className={cn(
        "grid cursor-pointer grid-cols-[40px_1fr_140px_170px_80px_100px_90px] items-center border-b border-[var(--es-neutral-100)] px-4 py-3.5 text-[13px] transition-colors hover:bg-muted/50",
        exitClasses,
        selected && "bg-[var(--es-accent-50)]",
      )}
    >
      <span onClick={stop}><Checkbox checked={selected} onCheckedChange={onToggle} aria-label={t.manager.selectAriaOne.replace("{name}", name)} /></span>
      <div>
        <div className="font-semibold">{name}</div>
        <div className="font-mono text-[11px] text-muted-foreground">{r.employee.employeeCode}</div>
      </div>
      <div className="flex items-center gap-1.5">
        <span>{formatLeaveType(r.leaveType)}</span>
        {r.hasAttachment && <StatusPill tone="info" dot={false}>PDF</StatusPill>}
      </div>
      <div>
        <div>{fmt.formatShortDate(r.startDate)} – {fmt.formatShortDate(r.endDate)}</div>
        <div className="truncate text-[11px] text-muted-foreground">{r.reason}</div>
      </div>
      <div className="tabular-nums font-semibold">{r.daysRequested}</div>
      <div className="text-xs text-muted-foreground">{fmt.formatShortDate(r.createdAt)}</div>
      <div className="flex justify-end gap-0.5">
        <button title={t.manager.approve} aria-label={`${t.manager.approve} ${name}`} onClick={(e) => { stop(e); onApprove(); }} className="rounded-md p-1.5 text-[var(--es-success-600)] transition-colors hover:bg-[var(--es-success-50)]"><Check className="size-4" /></button>
        <button title={t.manager.reject} aria-label={`${t.manager.reject} ${name}`} onClick={(e) => { stop(e); onReject(); }} className="rounded-md p-1.5 text-[var(--es-error-500)] transition-colors hover:bg-[var(--es-error-50)]"><X className="size-4" /></button>
      </div>
    </div>
  );
}
