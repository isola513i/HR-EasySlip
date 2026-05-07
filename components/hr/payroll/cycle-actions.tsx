"use client";

import { CheckCheck, Download, FileText, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PayrollCycle } from "@/hooks/use-payroll";

export interface CycleActionsProps {
  cycle: PayrollCycle;
  onLock: (c: PayrollCycle) => void;
  onMarkExported: (c: PayrollCycle) => void;
  onDownloadTimestamps: (c: PayrollCycle) => void;
  onDownloadPayrollInfo: (c: PayrollCycle) => void;
  labels: {
    lock: string;
    timestamps: string;
    export: string;
    markExported: string;
  };
}

export function CycleActions({
  cycle: c, onLock, onMarkExported, onDownloadTimestamps, onDownloadPayrollInfo, labels,
}: CycleActionsProps) {
  return (
    <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
      {c.status === "OPEN" && (
        <Button size="sm" variant="outline" onClick={() => onLock(c)}>
          <Lock className="mr-1 size-3.5" /> {labels.lock}
        </Button>
      )}
      {(c.status === "LOCKED" || c.status === "EXPORTED") && (
        <>
          <Button size="sm" variant="outline" onClick={() => onDownloadTimestamps(c)}>
            <FileText className="mr-1 size-3.5" /> {labels.timestamps}
          </Button>
          <Button size="sm" variant="outline" onClick={() => onDownloadPayrollInfo(c)}>
            <Download className="mr-1 size-3.5" /> {labels.export}
          </Button>
        </>
      )}
      {c.status === "LOCKED" && (
        <Button size="sm" variant="outline" onClick={() => onMarkExported(c)}>
          <CheckCheck className="mr-1 size-3.5" /> {labels.markExported}
        </Button>
      )}
    </div>
  );
}
