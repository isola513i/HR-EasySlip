"use client";

import Link from "next/link";
import { useState } from "react";
import { Download, Plus, Upload, MoreHorizontal, Users, KeyRound, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { StatusPill } from "@/components/shared/status-pill";
import { RoleBadge } from "@/components/shared/role-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useEmployees } from "@/hooks/use-employees";
import { BulkImportDialog } from "@/components/hr/bulk-import-dialog";
import { ScrollableTable } from "@/components/shared/scrollable-table";
import { useT } from "@/lib/i18n/locale-context";

const statusTone: Record<string, "success" | "warn" | "error" | "neutral"> = {
  ACTIVE: "success",
  PROBATION: "warn",
  SUSPENDED: "error",
  RESIGNED: "neutral",
};

export function EmployeeDirectory() {
  const t = useT();
  const statusFilters = [
    { label: t.common.all, value: "" },
    { label: t.hr.active, value: "ACTIVE" },
    { label: t.hr.probation, value: "PROBATION" },
    { label: t.hr.suspended, value: "SUSPENDED" },
  ];
  const { items, isLoading, error, setStatus, refetch } = useEmployees();
  const [activeFilter, setActiveFilter] = useState(0);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [resetResult, setResetResult] = useState<{ tempPassword: string; employeeCode: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleResetPassword = async (employeeId: string) => {
    try {
      const res = await fetch(`/api/v1/hr/employees/${employeeId}/reset-password`, { method: "POST" });
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

  const handleFilter = (idx: number) => {
    setActiveFilter(idx);
    setStatus(statusFilters[idx].value);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
        <div className="flex flex-wrap items-center gap-2">
          {statusFilters.map((f, i) => (
            <button
              key={f.label}
              onClick={() => handleFilter(i)}
              className={cn(
                "rounded-lg border px-3 py-[7px] text-xs font-medium transition-colors",
                i === activeFilter
                  ? "border-transparent bg-[var(--es-neutral-900)] text-white"
                  : "border-[var(--es-neutral-300)] bg-card text-muted-foreground hover:bg-muted",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="hidden flex-1 lg:block" />
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="flex-1 lg:flex-none" onClick={async () => {
            try {
              const res = await fetch("/api/v1/payroll/employees/export");
              if (!res.ok) throw new Error("Failed");
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url; a.download = "employees.xlsx";
              document.body.appendChild(a); a.click(); document.body.removeChild(a);
              URL.revokeObjectURL(url);
              toast.success(t.hr.exportSuccess);
            } catch { toast.error(t.hr.exportFailed); }
          }}>
            <Download className="mr-1.5 size-3.5" /> {t.common.export}
          </Button>
          <Button variant="outline" size="sm" className="flex-1 lg:flex-none" onClick={() => setBulkOpen(true)}>
            <Upload className="mr-1.5 size-3.5" /> {t.hr.bulkImport}
          </Button>
          <Link
            href="/hr/employees/new"
            className={cn(buttonVariants({ size: "sm" }), "flex-1 lg:flex-none")}
          >
            <Plus className="mr-1.5 size-3.5" /> {t.hr.addEmployee}
          </Link>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2 md:hidden">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4 shadow-[var(--es-shadow-sm)]">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-2 h-3 w-40" />
                <div className="mt-3 flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            ))
          : items.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-border bg-card p-4 shadow-[var(--es-shadow-sm)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">
                      {p.firstNameTh} {p.lastNameTh}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {p.employeeCode} · {p.department?.name ?? "—"}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="-mr-1 rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted" aria-label="Actions">
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleResetPassword(p.id)}>
                        <KeyRound className="mr-2 size-3.5" />
                        {t.password.resetPasswordMenu}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <RoleBadge role={p.roles?.[0] ?? "EMPLOYEE"} />
                  <StatusPill tone={statusTone[p.employmentStatus] ?? "neutral"}>
                    {p.employmentStatus}
                  </StatusPill>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                  <div>
                    <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Manager</dt>
                    <dd className="truncate">{p.manager ? `${p.manager.firstNameTh} ${p.manager.lastNameTh}` : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.hr.start}</dt>
                    <dd className="tabular-nums">
                      {p.hireDate ? new Date(p.hireDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" }) : "—"}
                    </dd>
                  </div>
                  <div className="col-span-2 min-w-0">
                    <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Email</dt>
                    <dd className="truncate">{p.user?.email ?? "—"}</dd>
                  </div>
                </dl>
              </div>
            ))}
        {!isLoading && items.length === 0 && !error && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card py-16 text-muted-foreground">
            <Users className="size-10 opacity-40" />
            <p className="text-sm">{t.hr.noEmployees}</p>
          </div>
        )}
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-border bg-card shadow-[var(--es-shadow-sm)] md:block">
        <ScrollableTable minWidth={760}>
            <div className="grid grid-cols-[90px_1.2fr_1fr_140px_1fr_100px_90px_36px] gap-x-3 border-b border-border bg-[var(--es-neutral-50)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              <span>{t.hr.code}</span>
              <span>{t.onboarding.employeeName}</span>
              <span>{t.hr.department}</span>
              <span>{t.hr.role}</span>
              <span>Manager</span>
              <span>{t.profile.status}</span>
              <span>{t.hr.start}</span>
              <span />
            </div>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-[90px_1.2fr_1fr_140px_1fr_100px_90px_36px] gap-x-3 items-center border-t border-[var(--es-neutral-100)] px-4 py-3">
                    <Skeleton className="h-4 w-16" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-4" />
                  </div>
                ))
              : items.map((p) => (
                  <div
                    key={p.id}
                    className="grid grid-cols-[90px_1.2fr_1fr_140px_1fr_100px_90px_36px] gap-x-3 items-center border-t border-[var(--es-neutral-100)] px-4 py-3 text-[13px]"
                  >
                    <span className="tabular-nums text-xs text-muted-foreground">
                      {p.employeeCode}
                    </span>
                    <div>
                      <div className="font-medium">{p.firstNameTh} {p.lastNameTh}</div>
                      <div className="text-[11px] text-muted-foreground">{p.user?.email ?? "—"}</div>
                    </div>
                    <span>{p.department?.name ?? "—"}</span>
                    <RoleBadge role={p.roles?.[0] ?? "EMPLOYEE"} />
                    <span className="text-xs text-muted-foreground">
                      {p.manager ? `${p.manager.firstNameTh} ${p.manager.lastNameTh}` : "—"}
                    </span>
                    <StatusPill tone={statusTone[p.employmentStatus] ?? "neutral"}>
                      {p.employmentStatus}
                    </StatusPill>
                    <span className="tabular-nums text-xs text-muted-foreground">
                      {p.hireDate ? new Date(p.hireDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" }) : "—"}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted">
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleResetPassword(p.id)}>
                          <KeyRound className="mr-2 size-3.5" />
                          {t.password.resetPasswordMenu}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
            {!isLoading && items.length === 0 && !error && (
              <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
                <Users className="size-10 opacity-40" />
                <p className="text-sm">{t.hr.noEmployees}</p>
              </div>
            )}
        </ScrollableTable>
      </div>

      <BulkImportDialog
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onDone={() => refetch()}
      />

      {/* Reset password result dialog */}
      <Dialog open={!!resetResult} onOpenChange={() => { setResetResult(null); setCopied(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.password.tempPasswordTitle}</DialogTitle>
          </DialogHeader>
          {resetResult && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {t.password.tempPasswordInfo}
              </p>
              <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
                <code className="flex-1 text-sm font-mono font-semibold">
                  {resetResult.tempPassword}
                </code>
                <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={handleCopyPassword}>
                  {copied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
                </Button>
              </div>
              <p className="text-xs text-destructive">
                {t.password.tempPasswordWarn}
              </p>
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
