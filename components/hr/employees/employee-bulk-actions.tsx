"use client";

import { Mail, Trash2, X } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";

interface Props {
  count: number;
  onSendEmail: () => void;
  onDelete: () => void;
  onClear: () => void;
}

export function EmployeeBulkActions({ count, onSendEmail, onDelete, onClear }: Props) {
  const t = useT();
  if (count === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-(--es-accent-300) bg-(--es-accent-50) p-2.5 pl-3">
      <span className="grid h-7 min-w-7 place-items-center rounded-md bg-(--es-accent-600) px-2 text-[12px] font-semibold tabular-nums text-white">
        {count}
      </span>
      <span className="text-[13px] font-medium text-foreground">
        {t.hr.employees.bulkSelectedLabel}
      </span>
      <span aria-hidden="true" className="mx-1 h-5 w-px bg-(--es-accent-300)" />
      <button
        type="button"
        onClick={onSendEmail}
        className="inline-flex h-10 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-[13px] font-medium text-(--es-accent-700) transition-colors hover:bg-(--es-accent-100)"
      >
        <Mail className="size-4" />
        {t.hr.employees.bulkSendEmail}
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="inline-flex h-10 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-[13px] font-medium text-(--es-error-600) transition-colors hover:bg-(--es-error-50)"
      >
        <Trash2 className="size-4" />
        {t.hr.employees.bulkDelete}
      </button>
      <button
        type="button"
        onClick={onClear}
        aria-label={t.hr.employees.bulkClear}
        className="ml-auto grid size-10 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
