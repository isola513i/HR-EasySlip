"use client";

import { useState, useEffect } from "react";
import { Download, MoreHorizontal } from "lucide-react";
import { StatusPill } from "@/components/shared/status-pill";
import { StatCard } from "@/components/shared/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, apiFetchPaginated } from "@/lib/api/client";
import { todayISO, formatTime } from "@/lib/format";
import { useT } from "@/lib/i18n/locale-context";

/* ── Types ───────────────────────────────────────────────────── */

interface AttendanceRecord {
  id: string;
  employeeId: string;
  clockType: "CLOCK_IN" | "CLOCK_OUT";
  clockedAt: string;
  workLocation: string;
  employee: {
    id: string;
    firstNameTh: string;
    lastNameTh: string;
    employeeCode: string;
  };
}

interface TeamMember {
  name: string;
  code: string;
  status: "in" | "leave" | "late" | "absent";
  time: string;
  loc: string;
}

interface KpiItem {
  label: string;
  value: string;
  tone: "success" | "warn" | "error" | "info" | "neutral";
  sub: string;
}

const statusTones = {
  in: "success" as const,
  leave: "info" as const,
  late: "warn" as const,
  absent: "error" as const,
};

const LATE_THRESHOLD_HOUR = 9;
const LATE_THRESHOLD_MINUTE = 15;

/* ── Helpers ─────────────────────────────────────────────────── */

function isLate(clockedAt: string): boolean {
  const d = new Date(clockedAt);
  return (
    d.getHours() > LATE_THRESHOLD_HOUR ||
    (d.getHours() === LATE_THRESHOLD_HOUR &&
      d.getMinutes() > LATE_THRESHOLD_MINUTE)
  );
}

function mapWorkLocation(loc: string): string {
  switch (loc) {
    case "OFFICE":
      return "Office";
    case "WFH":
      return "WFH";
    case "FIELD":
      return "Field";
    default:
      return loc;
  }
}

/**
 * Deduplicate attendance records per employee,
 * keeping only the first CLOCK_IN per person.
 */
function deriveTeamMembers(records: AttendanceRecord[]): TeamMember[] {
  const seen = new Map<string, TeamMember>();

  for (const r of records) {
    if (r.clockType !== "CLOCK_IN") continue;
    if (seen.has(r.employee.id)) continue;

    const late = isLate(r.clockedAt);
    seen.set(r.employee.id, {
      name: `${r.employee.firstNameTh} ${r.employee.lastNameTh}`,
      code: r.employee.employeeCode,
      status: late ? "late" : "in",
      time: formatTime(r.clockedAt),
      loc: mapWorkLocation(r.workLocation),
    });
  }

  return Array.from(seen.values());
}

function buildKpis(team: TeamMember[], pendingCount: number, t: ReturnType<typeof import("@/lib/i18n/locale-context").useT>): KpiItem[] {
  const checkedIn = team.filter(
    (m) => m.status === "in" || m.status === "late",
  ).length;
  const lateCount = team.filter((m) => m.status === "late").length;

  return [
    {
      label: t.manager.checkedIn,
      value: String(checkedIn),
      tone: "success",
      sub: checkedIn > 0 ? t.manager.checkedInSub.replace("{count}", String(checkedIn)) : t.manager.noCheckedIn,
    },
    {
      label: t.manager.onLeaveToday,
      value: "—",
      tone: "info",
      sub: t.manager.noLeaveData,
    },
    {
      label: t.manager.late,
      value: String(lateCount),
      tone: lateCount > 0 ? "warn" : "success",
      sub: lateCount > 0 ? t.manager.lateSub.replace("{min}", String(LATE_THRESHOLD_MINUTE)) : t.manager.noLate,
    },
    {
      label: t.manager.pendingApprovals,
      value: String(pendingCount),
      tone: pendingCount > 0 ? "error" : "success",
      sub: pendingCount > 0 ? t.manager.pendingSub : t.manager.noPendingItems,
    },
  ];
}

/* ── Component ───────────────────────────────────────────────── */

const dateStr = new Date().toLocaleDateString("en-US", {
  weekday: "long",
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function TeamDashboard() {
  const t = useT();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [kpis, setKpis] = useState<KpiItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [records, pendingResult] = await Promise.all([
          apiFetch<AttendanceRecord[]>(
            `/api/v1/attendance/team?date=${todayISO()}`,
          ),
          apiFetchPaginated<unknown>(
            "/api/v1/leave/approvals/pending?perPage=1",
          ),
        ]);

        if (cancelled) return;

        const members = deriveTeamMembers(records);
        const pendingCount = pendingResult.pagination.total;

        setTeam(members);
        setKpis(buildKpis(members, pendingCount, t));
      } catch {
        // On error, show empty state
        if (!cancelled) {
          setTeam([]);
          setKpis(buildKpis([], 0, t));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [t]);

  return (
    <div className="flex flex-col gap-5">
      {/* KPI tiles */}
      <div className="grid grid-cols-4 gap-3.5">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[110px] rounded-xl" />
            ))
          : kpis.map((k) => <StatCard key={k.label} {...k} />)}
      </div>

      {/* Team table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--es-shadow-sm)]">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div>
            <div className="text-[15px] font-semibold">{t.manager.teamToday}</div>
            <div className="text-xs text-muted-foreground">{dateStr}</div>
          </div>
          <button className="flex items-center gap-1.5 rounded-md border border-[var(--es-neutral-300)] bg-card px-3 py-[7px] text-xs font-medium text-muted-foreground transition-colors hover:bg-muted">
            <Download className="size-3.5" /> {t.manager.exportCSV}
          </button>
        </div>

        <div className="grid grid-cols-[1fr_120px_120px_140px_80px] bg-[var(--es-neutral-50)] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          <span>{t.manager.member}</span>
          <span>{t.manager.status}</span>
          <span>{t.manager.time}</span>
          <span>{t.manager.location}</span>
          <span />
        </div>

        {loading && <TeamTableSkeleton />}

        {!loading && team.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {t.manager.noTeamData}
          </div>
        )}

        {!loading &&
          team.map((p) => {
            const statusLabels = { in: t.manager.checkedIn, leave: t.manager.onLeave, late: t.manager.late, absent: t.manager.absent };
            return (
              <div
                key={p.code}
                className="grid grid-cols-[1fr_120px_120px_140px_80px] items-center border-t border-[var(--es-neutral-100)] px-5 py-3 text-[13px]"
              >
                <div className="flex items-center gap-2.5">
                  <div className="grid size-8 place-items-center rounded-full bg-[var(--es-neutral-100)] text-[11px] font-bold text-muted-foreground">
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">
                      {p.code}
                    </div>
                  </div>
                </div>
                <StatusPill tone={statusTones[p.status]}>{statusLabels[p.status]}</StatusPill>
                <span className="tabular-nums">{p.time}</span>
                <span className="text-muted-foreground">{p.loc}</span>
                <div className="flex justify-end">
                  <button
                    className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted"
                    aria-label={`More options for ${p.name}`}
                  >
                    <MoreHorizontal className="size-4" />
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

/* ── Table skeleton ──────────────────────────────────────────── */

function TeamTableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-[1fr_120px_120px_140px_80px] items-center border-t border-[var(--es-neutral-100)] px-5 py-3"
        >
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-8 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-3.5 w-12" />
          <Skeleton className="h-3.5 w-16" />
          <div />
        </div>
      ))}
    </>
  );
}
