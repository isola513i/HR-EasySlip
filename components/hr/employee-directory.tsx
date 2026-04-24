"use client";

import { useState } from "react";
import { Download, Plus, MoreHorizontal } from "lucide-react";
import { StatusPill } from "@/components/shared/status-pill";
import { RoleBadge } from "@/components/shared/role-badge";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useEmployees } from "@/hooks/use-employees";
import { EmployeeFormDialog } from "@/components/hr/employee-form-dialog";

const statusTone: Record<string, "success" | "warn" | "error" | "neutral"> = {
  ACTIVE: "success",
  PROBATION: "warn",
  SUSPENDED: "error",
  RESIGNED: "neutral",
};

const statusFilters = [
  { label: "All", value: "" },
  { label: "Active", value: "ACTIVE" },
  { label: "Probation", value: "PROBATION" },
  { label: "Suspended", value: "SUSPENDED" },
];

export function EmployeeDirectory() {
  const { items, isLoading, error, setSearch, setStatus, create, refetch } = useEmployees();
  const [activeFilter, setActiveFilter] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSearch = (v: string) => {
    setSearchValue(v);
    setSearch(v);
  };

  const handleFilter = (idx: number) => {
    setActiveFilter(idx);
    setStatus(statusFilters[idx].value);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2.5">
        <SearchInput
          placeholder="Search employee... name / code / email"
          className="max-w-[360px]"
          value={searchValue}
          onChange={handleSearch}
        />
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
        <div className="flex-1" />
        <Button variant="outline" size="sm">
          <Download className="mr-1.5 size-3.5" /> Export CSV
        </Button>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1.5 size-3.5" /> Add employee
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--es-shadow-sm)]">
        <div className="grid grid-cols-[100px_1fr_140px_110px_140px_110px_110px_40px] border-b border-border bg-[var(--es-neutral-50)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          <span>Code</span>
          <span>Employee</span>
          <span>Department</span>
          <span>Role</span>
          <span>Manager</span>
          <span>Status</span>
          <span>Start</span>
          <span />
        </div>
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[100px_1fr_140px_110px_140px_110px_110px_40px] items-center border-t border-[var(--es-neutral-100)] px-4 py-3">
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
                className="grid grid-cols-[100px_1fr_140px_110px_140px_110px_110px_40px] items-center border-t border-[var(--es-neutral-100)] px-4 py-3 text-[13px]"
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
                <span className="tabular-nums text-xs text-muted-foreground">—</span>
                <button className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted">
                  <MoreHorizontal className="size-4" />
                </button>
              </div>
            ))}
        {!isLoading && items.length === 0 && !error && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No employees found
          </div>
        )}
      </div>

      <EmployeeFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={() => refetch()}
        onCreate={create}
      />
    </div>
  );
}
