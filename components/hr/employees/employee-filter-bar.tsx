"use client";

import { Download, LayoutGrid, List, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/locale-context";
import type { EmploymentStatus } from "@/lib/employee/status-tones";

export type EmployeeView = "list" | "grid";

const FILTERABLE_STATUSES: readonly EmploymentStatus[] = ["ACTIVE", "PROBATION", "SUSPENDED", "RESIGNED"];

interface Props {
  search: string;
  onSearchChange: (s: string) => void;
  departmentId: string;
  onDepartmentChange: (id: string) => void;
  status: string;
  onStatusChange: (s: string) => void;
  type: string;
  onTypeChange: (t: string) => void;
  view: EmployeeView;
  onViewChange: (v: EmployeeView) => void;
  departments: Array<{ id: string; name: string }>;
  types: string[];
  onExport: () => void;
  onBulkImport: () => void;
}

export function EmployeeFilterBar({
  search,
  onSearchChange,
  departmentId,
  onDepartmentChange,
  status,
  onStatusChange,
  type,
  onTypeChange,
  view,
  onViewChange,
  departments,
  types,
  onExport,
  onBulkImport,
}: Props) {
  const t = useT();
  const statusLabels: Record<EmploymentStatus, string> = {
    ACTIVE: t.hr.active,
    PROBATION: t.hr.probation,
    SUSPENDED: t.hr.suspended,
    RESIGNED: t.hr.resigned,
    TERMINATED: t.hr.resigned,
  };
  const statusLabel = (s: string) => statusLabels[s as EmploymentStatus] ?? s;

  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-[var(--es-shadow-sm)]">
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
        <label className="relative flex flex-1 items-center">
          <Search className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground/70" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t.hr.employees.searchPlaceholder}
            aria-label={t.hr.employees.searchPlaceholder}
            className="h-10 w-full rounded-lg border border-border bg-card pl-10 pr-3 text-[13px] outline-none transition-colors hover:border-[var(--es-neutral-300)] focus:border-[var(--es-accent-400)] focus:ring-2 focus:ring-[var(--ring)] placeholder:text-muted-foreground/70"
          />
        </label>

        <Select value={departmentId || "ALL"} onValueChange={(v) => v && onDepartmentChange(v === "ALL" ? "" : v)}>
          <SelectTrigger className="h-10 min-w-[160px]">
            <SelectValue>
              {(value) =>
                value === "ALL"
                  ? t.hr.employees.allDepartments
                  : departments.find((d) => d.id === value)?.name ?? t.hr.employees.allDepartments
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t.hr.employees.allDepartments}</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status || "ALL"} onValueChange={(v) => v && onStatusChange(v === "ALL" ? "" : v)}>
          <SelectTrigger className="h-10 min-w-[160px]">
            <SelectValue>
              {(value) => (value === "ALL" ? t.hr.employees.allStatus : statusLabel(value))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t.hr.employees.allStatus}</SelectItem>
            {FILTERABLE_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={type || "ALL"} onValueChange={(v) => v && onTypeChange(v === "ALL" ? "" : v)}>
          <SelectTrigger className="h-10 min-w-[160px]">
            <SelectValue>
              {(value) => (value === "ALL" ? t.hr.employees.allTypes : value)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t.hr.employees.allTypes}</SelectItem>
            {types.map((tp) => (
              <SelectItem key={tp} value={tp}>{tp}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="inline-flex h-10 shrink-0 items-center rounded-lg border border-border bg-card p-0.5">
          <button
            type="button"
            onClick={() => onViewChange("list")}
            aria-label={t.hr.employees.viewList}
            aria-pressed={view === "list"}
            className={cn(
              "grid size-9 place-items-center rounded-md transition-colors",
              view === "list" ? "bg-[var(--es-accent-50)] text-[var(--es-accent-700)]" : "text-muted-foreground hover:bg-muted",
            )}
          >
            <List className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewChange("grid")}
            aria-label={t.hr.employees.viewGrid}
            aria-pressed={view === "grid"}
            className={cn(
              "grid size-9 place-items-center rounded-md transition-colors",
              view === "grid" ? "bg-[var(--es-accent-50)] text-[var(--es-accent-700)]" : "text-muted-foreground hover:bg-muted",
            )}
          >
            <LayoutGrid className="size-4" />
          </button>
        </div>

        <Button variant="outline" onClick={onExport} className="gap-1.5">
          <Download className="size-4" />
          {t.common.export}
        </Button>
        <Button variant="outline" onClick={onBulkImport} className="gap-1.5">
          <Upload className="size-4" />
          {t.hr.bulkImport}
        </Button>
      </div>
    </div>
  );
}
