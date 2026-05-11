"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmployeeForm } from "@/components/hr/employee-form";
import { BulkImportDialog } from "@/components/hr/bulk-import-dialog";
import { useEmployees } from "@/hooks/use-employees";
import { useT } from "@/lib/i18n/locale-context";

export function NewEmployeeView() {
  const t = useT();
  const router = useRouter();
  const { create } = useEmployees();
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  const handleSuccess = (initialPassword: string | null) => {
    if (initialPassword) {
      setCreatedPassword(initialPassword);
    } else {
      router.push("/hr/employees");
    }
  };

  const handleCopy = async () => {
    if (!createdPassword) return;
    await navigator.clipboard.writeText(createdPassword);
    setCopied(true);
    toast.success(t.common.copied);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCloseDialog = () => {
    setCreatedPassword(null);
    setCopied(false);
    router.push("/hr/employees");
  };

  return (
    <div className="flex flex-col gap-5">
      <Breadcrumbs
        items={[
          { label: t.hr.nav.employees, href: "/hr/employees" },
          { label: t.hr.addEmployeeTitle },
        ]}
      />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t.hr.addEmployeeTitle}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.hr.newEmployeeSubtitle}</p>
        </div>
        <Button variant="outline" onClick={() => setBulkOpen(true)} className="gap-1.5">
          <FileSpreadsheet className="size-4" />
          {t.hr.importFromEmpeo}
        </Button>
      </div>

      <div className="max-w-2xl rounded-xl border border-(--es-info-200) bg-(--es-info-50) p-3 text-[12px] text-(--es-info-700)">
        {t.hr.empeoImportHint}
      </div>

      <div className="max-w-2xl rounded-xl border border-border bg-card p-5 shadow-(--es-shadow-sm) sm:p-6">
        <EmployeeForm
          onCreate={create}
          onSuccess={handleSuccess}
          cancelHref="/hr/employees"
        />
      </div>

      <BulkImportDialog
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onDone={() => router.push("/hr/employees")}
      />

      <Dialog open={!!createdPassword} onOpenChange={(v) => { if (!v) handleCloseDialog(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.password.initialPasswordTitle}</DialogTitle>
          </DialogHeader>
          {createdPassword && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{t.password.initialPasswordInfo}</p>
              <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
                <code className="flex-1 font-mono text-sm font-semibold">{createdPassword}</code>
                <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={handleCopy}>
                  {copied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
                </Button>
              </div>
              <p className="text-xs text-destructive">{t.password.tempPasswordWarn}</p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleCloseDialog} className="w-full">
              {t.password.tempPasswordClose}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
