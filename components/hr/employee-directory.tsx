"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { cn } from "@/lib/utils";
import { useEmployees, type Employee } from "@/hooks/use-employees";
import { downloadBlob } from "@/lib/export/csv-download";
import { openMailto } from "@/lib/email/open-mailto";
import { BulkImportDialog } from "@/components/hr/bulk-import-dialog";
import { EmployeeFilterBar, type EmployeeView } from "@/components/hr/employees/employee-filter-bar";
import { EmployeeBulkActions } from "@/components/hr/employees/employee-bulk-actions";
import { EmployeeTable } from "@/components/hr/employees/employee-table";
import { EmployeeGrid } from "@/components/hr/employees/employee-grid";
import { EmployeeDetailSheet } from "@/components/hr/employees/employee-detail-sheet";
import { useT } from "@/lib/i18n/locale-context";

export function EmployeeDirectory() {
  const t = useT();
  const {
    items,
    pagination,
    filters,
    isLoading,
    error,
    refetch,
    anonymize,
    setSearch,
    setStatus,
    setDepartmentId,
  } = useEmployees();

  const [typeValue, setTypeValue] = useState("");
  const [view, setView] = useState<EmployeeView>("list");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [detailEmployee, setDetailEmployee] = useState<Employee | null>(null);
  const [resetResult, setResetResult] = useState<{ tempPassword: string; employeeCode: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const departments = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of items) if (e.department?.id) map.set(e.department.id, e.department.name);
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1])).map(([id, name]) => ({ id, name }));
  }, [items]);

  const types = useMemo(() => {
    const set = new Set<string>();
    for (const e of items) if (e.employmentType) set.add(e.employmentType);
    return [...set].sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!typeValue) return items;
    return items.filter((e) => e.employmentType === typeValue);
  }, [items, typeValue]);

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleSelectAll = () =>
    setSelected((prev) =>
      prev.size === filteredItems.length ? new Set() : new Set(filteredItems.map((e) => e.id)),
    );
  const clearSelection = () => setSelected(new Set());

  const handleResetPassword = async (emp: Employee) => {
    try {
      const res = await fetch(`/api/v1/hr/employees/${emp.id}/reset-password`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Reset failed");
      const d = data.data ?? data;
      setResetResult({ tempPassword: d.tempPassword, employeeCode: d.employeeCode });
      toast.success(t.password.resetSuccess);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.password.resetFailed);
    }
  };

  const handleCopyPassword = async () => {
    if (!resetResult) return;
    await navigator.clipboard.writeText(resetResult.tempPassword);
    setCopied(true);
    toast.success(t.common.copied);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmailToEmployee = (emp: Employee) => {
    if (!openMailto(emp.user?.email ?? "")) toast.error(t.hr.employees.actionEmail);
  };

  const handleBulkSendEmail = () => {
    const emails = filteredItems.filter((e) => selected.has(e.id)).map((e) => e.user?.email ?? "");
    if (!openMailto(emails)) toast.error(t.hr.employees.actionEmail);
  };

  const handleBulkDeleteConfirm = async () => {
    const ids = [...selected];
    const { ok, failed } = await anonymize(ids);
    if (failed === 0) {
      toast.success(t.hr.employees.deleteSuccessFmt.replace("{ok}", String(ok)));
    } else {
      toast.warning(
        t.hr.employees.deletePartialFmt.replace("{ok}", String(ok)).replace("{failed}", String(failed)),
      );
    }
    clearSelection();
  };

  const handleExport = async () => {
    try {
      const res = await fetch("/api/v1/payroll/employees/export");
      if (!res.ok) throw new Error("Failed");
      downloadBlob(await res.blob(), "employees.xlsx");
      toast.success(t.hr.exportSuccess);
    } catch {
      toast.error(t.hr.exportFailed);
    }
  };

  const total = pagination.total || items.length;
  const shown = filteredItems.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">{t.hr.employees.pageTitle}</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground tabular-nums">
            {t.hr.employees.countFmt.replace("{shown}", String(shown)).replace("{total}", String(total))}
          </p>
        </div>
        <Link href="/hr/employees/new" className={cn(buttonVariants(), "gap-1.5")}>
          <Plus className="size-4" />
          {t.hr.addEmployee}
        </Link>
      </div>

      <EmployeeFilterBar
        search={filters.search}
        onSearchChange={setSearch}
        departmentId={filters.departmentId}
        onDepartmentChange={setDepartmentId}
        status={filters.status}
        onStatusChange={setStatus}
        type={typeValue}
        onTypeChange={setTypeValue}
        view={view}
        onViewChange={setView}
        departments={departments}
        types={types}
        onExport={handleExport}
        onBulkImport={() => setBulkImportOpen(true)}
      />

      <EmployeeBulkActions
        count={selected.size}
        onSendEmail={handleBulkSendEmail}
        onDelete={() => setDeleteOpen(true)}
        onClear={clearSelection}
      />

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {view === "list" ? (
        <EmployeeTable
          rows={filteredItems}
          selected={selected}
          onToggle={toggleSelect}
          onToggleAll={toggleSelectAll}
          onView={setDetailEmployee}
          onResetPassword={handleResetPassword}
          onSendEmail={handleSendEmailToEmployee}
          isLoading={isLoading}
        />
      ) : (
        <EmployeeGrid
          rows={filteredItems}
          selected={selected}
          onToggle={toggleSelect}
          onView={setDetailEmployee}
          onResetPassword={handleResetPassword}
          onSendEmail={handleSendEmailToEmployee}
          isLoading={isLoading}
        />
      )}

      <BulkImportDialog
        open={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
        onDone={() => refetch()}
      />

      <EmployeeDetailSheet employee={detailEmployee} onClose={() => setDetailEmployee(null)} />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleBulkDeleteConfirm}
        title={t.hr.employees.deleteDialogTitle.replace("{count}", String(selected.size))}
        description={t.hr.employees.deleteDialogBody}
        confirmLabel={t.hr.employees.deleteDialogConfirm}
        variant="destructive"
      />

      <Dialog open={!!resetResult} onOpenChange={() => { setResetResult(null); setCopied(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.password.tempPasswordTitle}</DialogTitle>
          </DialogHeader>
          {resetResult && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{t.password.tempPasswordInfo}</p>
              <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
                <code className="flex-1 text-sm font-mono font-semibold">{resetResult.tempPassword}</code>
                <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={handleCopyPassword}>
                  {copied ? <Check className="size-4 text-[var(--es-success-600)]" /> : <Copy className="size-4" />}
                </Button>
              </div>
              <p className="text-xs text-destructive">{t.password.tempPasswordWarn}</p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => { setResetResult(null); setCopied(false); }} className="w-full">
              {t.password.tempPasswordClose}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
