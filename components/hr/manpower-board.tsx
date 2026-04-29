"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { StatusPill } from "@/components/shared/status-pill";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useLocale } from "@/hooks/use-locale";
import { useT } from "@/lib/i18n/locale-context";
import { useManpower } from "@/hooks/use-manpower";
import type { ManpowerEmployee, ManpowerStatus } from "@/lib/hr/manpower-service";
import type { LeaveType } from "@prisma/client";

type Filter = "ALL" | ManpowerStatus;

const dotBg: Record<ManpowerStatus, string> = {
  WORKING: "bg-[var(--es-success-500)]",
  ON_LEAVE: "bg-[var(--es-warn-500)]",
  OFF: "bg-[var(--es-neutral-400)]",
};

const statusTone: Record<ManpowerStatus, "success" | "warn" | "neutral"> = {
  WORKING: "success",
  ON_LEAVE: "warn",
  OFF: "neutral",
};

const todayDateString = () => {
  const offset = 7 * 60 * 60 * 1000;
  return new Date(Date.now() + offset).toISOString().slice(0, 10);
};

const shiftDate = (dateStr: string, days: number): string => {
  const d = new Date(dateStr + "T00:00:00.000Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export function ManpowerBoard() {
  const t = useT();
  const { locale } = useLocale();
  const [date, setDate] = useState<string>(() => todayDateString());
  const [filter, setFilter] = useState<Filter>("WORKING");
  const { data, isLoading, error } = useManpower(date);

  const m = t.hr.manpower;
  const employees = data ?? [];
  const isToday = date === todayDateString();

  const counts = useMemo(() => {
    let working = 0, onLeave = 0, off = 0;
    for (const e of employees) {
      if (e.status === "WORKING") working++;
      else if (e.status === "ON_LEAVE") onLeave++;
      else off++;
    }
    return { all: employees.length, working, onLeave, off };
  }, [employees]);

  const visible = useMemo(() => {
    if (filter === "ALL") return employees;
    return employees.filter((e) => e.status === filter);
  }, [employees, filter]);

  const dateLabel = useMemo(() => {
    return new Date(date + "T00:00:00.000Z").toLocaleDateString(
      locale === "th" ? "th-TH" : "en-US",
      { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" },
    );
  }, [date, locale]);

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(locale === "th" ? "th-TH" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: "ALL", label: m.filterAll, count: counts.all },
    { key: "WORKING", label: m.filterWorking, count: counts.working },
    { key: "ON_LEAVE", label: m.filterOnLeave, count: counts.onLeave },
    { key: "OFF", label: m.filterOff, count: counts.off },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--es-shadow-sm)]">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <div className="text-[15px] font-semibold tracking-tight">{m.title}</div>
          <div className="text-xs text-muted-foreground">{m.subtitle}</div>
        </div>
        <DatePicker
          date={date}
          dateLabel={dateLabel}
          isToday={isToday}
          onPrev={() => setDate((d) => shiftDate(d, -1))}
          onNext={() => setDate((d) => shiftDate(d, 1))}
          onChange={setDate}
          onToday={() => setDate(todayDateString())}
          todayLabel={m.todayShort}
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {filters.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={active}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-muted-foreground hover:border-foreground/40 hover:text-foreground",
              )}
            >
              {f.key !== "ALL" && (
                <span className={cn("size-1.5 rounded-full", dotBg[f.key])} />
              )}
              <span>{f.label}</span>
              <span className={cn("tabular-nums", active ? "text-background/70" : "text-muted-foreground/70")}>
                {f.count}
              </span>
            </button>
          );
        })}
      </div>

      {error ? (
        <div className="py-10 text-center text-sm text-destructive">{error}</div>
      ) : isLoading && !data ? (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[58px] rounded-lg" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">{m.noResults}</div>
      ) : (
        <div className={cn(
          "grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
          isLoading && "opacity-60 transition-opacity",
        )}>
          {visible.map((e) => (
            <EmployeeCard
              key={e.id}
              employee={e}
              t={t}
              formatTime={formatTime}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface DatePickerProps {
  date: string;
  dateLabel: string;
  isToday: boolean;
  onPrev: () => void;
  onNext: () => void;
  onChange: (date: string) => void;
  onToday: () => void;
  todayLabel: string;
}

function DatePicker({ date, dateLabel, isToday, onPrev, onNext, onChange, onToday, todayLabel }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [y, m, d] = date.split("-").map(Number);
  const selected = y && m && d ? new Date(y, m - 1, d) : undefined;

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onPrev}
        aria-label="Previous day"
        className="grid size-7 cursor-pointer place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ChevronLeft className="size-3.5" />
      </button>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className="cursor-pointer rounded-md px-2 py-1 text-xs tabular-nums text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-[var(--ring)] data-popup-open:bg-muted data-popup-open:text-foreground"
        >
          {dateLabel}
        </PopoverTrigger>
        <PopoverContent align="center" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected}
            onSelect={(picked) => {
              if (!picked) return;
              const yy = picked.getFullYear();
              const mm = String(picked.getMonth() + 1).padStart(2, "0");
              const dd = String(picked.getDate()).padStart(2, "0");
              onChange(`${yy}-${mm}-${dd}`);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      <button
        type="button"
        onClick={onNext}
        aria-label="Next day"
        className="grid size-7 cursor-pointer place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ChevronRight className="size-3.5" />
      </button>
      {!isToday && (
        <button
          type="button"
          onClick={onToday}
          className="ml-1 cursor-pointer rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
        >
          {todayLabel}
        </button>
      )}
    </div>
  );
}

const leaveLabel = (lt: LeaveType, t: ReturnType<typeof useT>): string => {
  const map = t.leave;
  switch (lt) {
    case "SICK": return map.sick;
    case "PERSONAL": return map.personal;
    case "ANNUAL": return map.annual;
    case "LEAVE_WITHOUT_PAY": return map.lwp;
    case "MATERNITY": return map.maternity;
    case "PATERNITY": return map.paternity;
    case "CHILD_CARE": return map.childCare;
    case "ORDINATION": return map.ordination;
    case "MILITARY": return map.military;
    case "FUNERAL": return map.funeral;
    case "TRAINING": return map.training;
    default: return lt;
  }
};

interface EmployeeCardProps {
  employee: ManpowerEmployee;
  t: ReturnType<typeof useT>;
  formatTime: (iso: string) => string;
}

function EmployeeCard({ employee: e, t, formatTime }: EmployeeCardProps) {
  const m = t.hr.manpower;
  const initials = (e.nicknameTh ?? e.firstNameTh).slice(0, 2);
  const fullName = `${e.firstNameTh} ${e.lastNameTh}`;
  const subline =
    e.status === "ON_LEAVE" && e.leaveType
      ? leaveLabel(e.leaveType, t)
      : e.status === "WORKING" && e.lastClockInAt
        ? m.clockedInAt.replace("{time}", formatTime(e.lastClockInAt))
        : (e.departmentName ?? e.employeeCode);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-2.5 transition-colors hover:bg-muted/40">
      <div className="relative shrink-0">
        <div className="es-brand-gradient grid size-10 place-items-center rounded-full text-[12px] font-semibold text-white">
          {initials}
        </div>
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-card",
            dotBg[e.status],
          )}
          aria-hidden="true"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{fullName}</div>
        <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{subline}</div>
      </div>
      <StatusPill tone={statusTone[e.status]} dot={false} className="shrink-0">
        {e.status === "WORKING" ? m.statusWorking : e.status === "ON_LEAVE" ? m.statusOnLeave : m.statusOff}
      </StatusPill>
    </div>
  );
}
