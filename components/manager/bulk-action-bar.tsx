"use client";

import { Check, X } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";

interface Props {
  count: number;
  onCancel: () => void;
  onApproveAll: () => void;
  onRejectAll: () => void;
}

export function BulkActionBar({ count, onCancel, onApproveAll, onRejectAll }: Props) {
  const t = useT();
  if (count === 0) return null;
  return (
    <div className="safe-area-pb fixed inset-x-0 bottom-3 z-30 mx-auto w-fit max-w-[calc(100vw-1rem)] px-2 sm:bottom-6 sm:px-0">
      <div className="flex flex-wrap items-center justify-center gap-2 rounded-[10px] border border-border bg-card px-3 py-2.5 shadow-[0_10px_40px_-10px_rgba(16,24,40,0.25),0_2px_6px_rgba(16,24,40,0.08)] sm:flex-nowrap sm:gap-3">
        <div className="text-[13px]">
          <b className="tabular-nums font-semibold">{count}</b>
          <span className="text-muted-foreground"> {t.manager.selected}</span>
        </div>
        <div className="hidden h-5 w-px bg-border sm:block" />
        <button onClick={onCancel} className="rounded-md border border-(--es-neutral-300) bg-card px-3 py-[7px] text-[13px] font-medium transition-colors hover:bg-muted">
          {t.common.cancel}
        </button>
        <button onClick={onRejectAll} className="flex items-center gap-1.5 rounded-md border border-(--es-error-500) bg-card px-3 py-[7px] text-[13px] font-semibold text-(--es-error-500) transition-colors hover:bg-(--es-error-50)">
          <X className="size-3.5" /> {t.manager.rejectAll}
        </button>
        <button onClick={onApproveAll} className="flex items-center gap-1.5 rounded-md bg-(--es-success-600) px-3.5 py-[7px] text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(22,163,74,0.2)] transition-colors hover:bg-(--es-success-700)">
          <Check className="size-3.5" /> {t.manager.approveAll}
        </button>
      </div>
    </div>
  );
}
