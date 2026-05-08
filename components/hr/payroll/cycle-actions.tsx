"use client";

import { CheckCheck, Download, FileText, Lock, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PayrollCycle } from "@/hooks/use-payroll";

export interface CycleActionsProps {
  cycle: PayrollCycle;
  onLock: (c: PayrollCycle) => void;
  onMarkExported: (c: PayrollCycle) => void;
  onDownloadTimestamps: (c: PayrollCycle) => void;
  onDownloadPayrollInfo: (c: PayrollCycle) => void;
  onDownloadEmpeoTemplate: (c: PayrollCycle) => void;
  labels: {
    lock: string;
    timestamps: string;
    export: string;
    empeoTemplate: string;
    markExported: string;
  };
}

export function CycleActions({
  cycle: c, onLock, onMarkExported, onDownloadTimestamps, onDownloadPayrollInfo, onDownloadEmpeoTemplate, labels,
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
          <Button size="sm" variant="outline" onClick={() => onDownloadEmpeoTemplate(c)}>
            <FileSpreadsheet className="mr-1 size-3.5" /> {labels.empeoTemplate}
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
