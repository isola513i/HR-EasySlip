"use client";

import { useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/shared/status-pill";
import { ScrollableTable } from "@/components/shared/scrollable-table";
import { SearchInput } from "@/components/shared/search-input";
import { EmployeeAvatar } from "@/components/hr/attendance/employee-avatar";
import { useAttendanceToday, type TodayAttendanceRow } from "@/hooks/use-attendance-today";
import { useT } from "@/lib/i18n/locale-context";
import { formatTime, formatShortDate } from "@/lib/format";
import type { AttendanceStatus } from "@/lib/attendance/constants";

interface Props { date: string }

const STATUS_TONE: Record<AttendanceStatus, "success" | "warn" | "error" | "info" | "accent"> = {
  ON_TIME: "success",
  LATE: "warn",
  ABSENT: "error",
  ON_LEAVE: "info",
  HOLIDAY: "accent",
};

const GRID = "grid-cols-[1.6fr_120px_120px_120px_120px_110px]";

function initialsOf(row: TodayAttendanceRow): string {
  return `${row.firstNameTh.charAt(0)}${row.lastNameTh.charAt(0)}`;
}

function workingHoursLabel(mins: number | null): string {
  if (mins == null) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

export function TodayAttendanceTable({ date }: Props) {
  const t = useT();
  const { rows, isLoading } = useAttendanceToday(date);
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState<string>("all");

  const departments = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rows) if (r.departmentId && r.departmentName) map.set(r.departmentId, r.departmentName);
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (dept !== "all" && r.departmentId !== dept) return false;
      if (!q) return true;
      const hay = `${r.firstNameTh} ${r.lastNameTh} ${r.employeeCode}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, query, dept]);

  return (
    <div className="rounded-xl border border-border bg-card shadow-[var(--es-shadow-sm)]">
      <div className="flex flex-wrap items-center gap-2.5 border-b border-border px-5 py-3.5">
        <div className="flex-1 text-base font-semibold">{t.hr.attendance.todayAttendance}</div>
        <div className="flex flex-1 flex-wrap items-center justify-end gap-2 sm:flex-none">
          <select
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            className="rounded-md border border-border bg-card px-2.5 py-1.5 text-xs"
          >
            <option value="all">{t.hr.attendance.allDepartments}</option>
            {departments.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder={t.hr.attendance.searchPlaceholder}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2 p-5">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">{t.hr.attendance.empty}</div>
      ) : (
        <>
          <div className="hidden md:block">
            <ScrollableTable minWidth={900}>
              <div className={`grid ${GRID} items-center border-b border-border bg-[var(--es-neutral-50)] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground`}>
                <span>{t.hr.attendance.colEmployee}</span>
                <span>{t.hr.attendance.colCheckIn}</span>
                <span>{t.hr.attendance.colCheckOut}</span>
                <span>{t.hr.attendance.colWorkingHours}</span>
                <span>{t.hr.attendance.colDate}</span>
                <span>{t.hr.attendance.colStatus}</span>
              </div>
              {filtered.map((r) => (
                <div key={r.employeeId} className={`grid ${GRID} items-center border-b border-[var(--es-neutral-100)] px-5 py-3 text-[13px] last:border-b-0`}>
                  <div className="flex min-w-0 items-center gap-2.5">
                    <EmployeeAvatar seed={r.employeeCode} initials={initialsOf(r)} />
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{r.firstNameTh} {r.lastNameTh}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">{r.employeeCode}</div>
                    </div>
                  </div>
                  <div className="tabular-nums">{r.checkIn ? formatTime(r.checkIn) : "—"}</div>
                  <div className="tabular-nums">{r.checkOut ? formatTime(r.checkOut) : "—"}</div>
                  <div className="tabular-nums">{workingHoursLabel(r.workingMinutes)}</div>
                  <div className="text-muted-foreground">{formatShortDate(date, "numeric")}</div>
                  <div>
                    <StatusPill tone={STATUS_TONE[r.status]} dot>
                      {t.hr.attendance.status[r.status]}
                    </StatusPill>
                  </div>
                </div>
              ))}
            </ScrollableTable>
          </div>

          <div className="flex flex-col divide-y divide-[var(--es-neutral-100)] md:hidden">
            {filtered.map((r) => (
              <div key={r.employeeId} className="flex items-start gap-3 px-4 py-3">
                <EmployeeAvatar seed={r.employeeCode} initials={initialsOf(r)} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-semibold">{r.firstNameTh} {r.lastNameTh}</div>
                    <StatusPill tone={STATUS_TONE[r.status]} dot>
                      {t.hr.attendance.status[r.status]}
                    </StatusPill>
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground">{r.employeeCode}</div>
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] tabular-nums">
                    <span>{t.hr.attendance.colCheckIn}: {r.checkIn ? formatTime(r.checkIn) : "—"}</span>
                    <span>{t.hr.attendance.colCheckOut}: {r.checkOut ? formatTime(r.checkOut) : "—"}</span>
                    <span>{workingHoursLabel(r.workingMinutes)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
