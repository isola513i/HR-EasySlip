"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/shared/status-pill";
import {
  useLeaveCalendar,
  type LeaveCalendarEntry,
} from "@/hooks/use-leave-calendar";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type Tone = "warn" | "info" | "accent" | "neutral";
const LEAVE_TYPE_TONE: Record<string, Tone> = {
  SICK: "warn",
  ANNUAL: "info",
  PERSONAL: "accent",
  LEAVE_WITHOUT_PAY: "neutral",
};

const STATUS_TONE: Record<string, "success" | "warn" | "error" | "neutral"> = {
  APPROVED: "success",
  PENDING: "warn",
  REJECTED: "error",
};

function formatRange(start: string, end: string): string {
  const s = new Date(start).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const e = new Date(end).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return s === e ? s : `${s} – ${e}`;
}

type GroupedEntry = {
  employee: LeaveCalendarEntry["employee"];
  leaves: LeaveCalendarEntry[];
};

function groupByEmployee(entries: LeaveCalendarEntry[]): GroupedEntry[] {
  const map = new Map<string, GroupedEntry>();
  for (const entry of entries) {
    const key = entry.employee.id;
    if (!map.has(key)) {
      map.set(key, { employee: entry.employee, leaves: [] });
    }
    map.get(key)!.leaves.push(entry);
  }
  return Array.from(map.values()).sort((a, b) =>
    a.employee.employeeCode.localeCompare(b.employee.employeeCode),
  );
}

export function LeaveCalendarView() {
  const { entries, isLoading, error, month, setMonth, year, setYear } =
    useLeaveCalendar();

  const goBack = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const goForward = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const grouped = groupByEmployee(entries);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={goBack}>
          <ChevronLeft className="size-4" />
        </Button>
        <h2 className="min-w-[160px] text-center text-lg font-semibold">
          {MONTH_NAMES[month - 1]} {year}
        </h2>
        <Button variant="outline" size="icon" onClick={goForward}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="py-16 text-center text-[var(--es-error-500)]">{error}</div>
      ) : grouped.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          No leave requests for this month
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ employee, leaves }) => (
            <div key={employee.id} className="rounded-lg border p-4">
              <p className="mb-2 font-medium">
                <span className="text-muted-foreground">{employee.employeeCode}</span>{" "}
                {employee.firstNameTh} {employee.lastNameTh}
              </p>
              <div className="flex flex-wrap gap-2">
                {leaves.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5 text-sm"
                  >
                    <span className="tabular-nums">{formatRange(l.startDate, l.endDate)}</span>
                    <Badge variant="secondary">
                      <span className={`mr-1 inline-block size-2 rounded-full bg-[var(--es-${LEAVE_TYPE_TONE[l.leaveType] ?? "neutral"}-500)]`} />
                      {l.leaveType.replace(/_/g, " ")}
                    </Badge>
                    <span className="text-muted-foreground">
                      {l.daysRequested}d{l.halfDay ? " (half)" : ""}
                    </span>
                    <StatusPill tone={STATUS_TONE[l.status] ?? "neutral"}>
                      {l.status}
                    </StatusPill>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
