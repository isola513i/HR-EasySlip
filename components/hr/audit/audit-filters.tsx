"use client";

import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AUDIT_MODULES, type AuditModule } from "@/lib/audit/categories";
import { useT } from "@/lib/i18n/locale-context";
import type { AuditDateRange } from "@/hooks/use-audit-logs";

interface Props {
  search: string;
  onSearchChange: (s: string) => void;
  moduleFilter: AuditModule | "ALL";
  onModuleChange: (m: AuditModule | "ALL") => void;
  dateRange: AuditDateRange;
  onDateRangeChange: (r: AuditDateRange) => void;
}

export function AuditFilters({
  search,
  onSearchChange,
  moduleFilter,
  onModuleChange,
  dateRange,
  onDateRangeChange,
}: Props) {
  const t = useT();
  const ranges: AuditDateRange[] = ["7d", "30d", "90d", "all"];

  return (
    <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
      <label className="relative flex flex-1 items-center">
        <Search className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground/70" aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t.hr.auditSearch}
          aria-label={t.hr.auditSearch}
          className="h-10 w-full rounded-lg border border-border bg-card pl-10 pr-3 text-[13px] outline-none transition-colors hover:border-[var(--es-neutral-300)] focus:border-[var(--es-accent-400)] focus:ring-2 focus:ring-[var(--ring)] placeholder:text-muted-foreground/70"
        />
      </label>

      <Select value={moduleFilter} onValueChange={(v) => v && onModuleChange(v as AuditModule | "ALL")}>
        <SelectTrigger className="h-10 min-w-[160px]">
          <SelectValue>
            {(value) => (value === "ALL" ? t.hr.audit.allModules : t.hr.audit.modules[value as AuditModule])}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">{t.hr.audit.allModules}</SelectItem>
          {AUDIT_MODULES.map((m) => (
            <SelectItem key={m} value={m}>{t.hr.audit.modules[m]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={dateRange} onValueChange={(v) => v && onDateRangeChange(v as AuditDateRange)}>
        <SelectTrigger className="h-10 min-w-[160px]">
          <SelectValue>
            {(value) => t.hr.audit.ranges[value as AuditDateRange]}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {ranges.map((r) => (
            <SelectItem key={r} value={r}>{t.hr.audit.ranges[r]}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
