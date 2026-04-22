"use client";

import { useState } from "react";
import { Download, Plus, MoreHorizontal } from "lucide-react";
import { StatusPill } from "@/components/shared/status-pill";
import { RoleBadge } from "@/components/shared/role-badge";
import { SearchInput } from "@/components/shared/search-input";
import { cn } from "@/lib/utils";

const employees = [
  { code: "ES0042", name: "Suda Thongdee", email: "suda.t@esg.co.th", dept: "Engineering", role: "EMPLOYEE", manager: "K. Somchai", status: "ACTIVE", start: "2022-03-15" },
  { code: "ES0018", name: "Nattapol Kaewcharoen", email: "nattapol.k@esg.co.th", dept: "Engineering", role: "EMPLOYEE", manager: "K. Somchai", status: "ACTIVE", start: "2021-07-01" },
  { code: "ES0031", name: "Piyanuch Seedum", email: "piyanuch.s@esg.co.th", dept: "Marketing", role: "EMPLOYEE", manager: "K. Wipa", status: "ACTIVE", start: "2023-01-10" },
  { code: "ES0027", name: "Anon Chokdee", email: "anon.c@esg.co.th", dept: "Engineering", role: "EMPLOYEE", manager: "K. Somchai", status: "PROBATION", start: "2026-02-20" },
  { code: "ES0055", name: "Malee Suayngam", email: "malee.s@esg.co.th", dept: "Design", role: "MANAGER", manager: "K. Natee", status: "ACTIVE", start: "2020-11-03" },
  { code: "ES0061", name: "Somchai Ruayluea", email: "somchai.r@esg.co.th", dept: "Engineering", role: "MANAGER", manager: "K. Natee", status: "ACTIVE", start: "2019-08-12" },
  { code: "ES0064", name: "Weeraya Sangjan", email: "weeraya.s@esg.co.th", dept: "HR", role: "HR_AUTHORIZED", manager: "K. Apinya", status: "ACTIVE", start: "2022-09-01" },
  { code: "ES0070", name: "Preecha Jaidee", email: "preecha.j@esg.co.th", dept: "Finance", role: "EMPLOYEE", manager: "K. Duangjai", status: "SUSPENDED", start: "2021-04-19" },
];

const statusTone: Record<string, "success" | "warn" | "error" | "neutral"> = {
  ACTIVE: "success",
  PROBATION: "warn",
  SUSPENDED: "error",
  RESIGNED: "neutral",
};

const statusFilters = ["All", "Active", "Probation", "Suspended"];

export function EmployeeDirectory() {
  const [activeFilter, setActiveFilter] = useState(0);

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2.5">
        <SearchInput placeholder="Search employee... name / code / email" className="max-w-[360px]" />
        {statusFilters.map((f, i) => (
          <button
            key={f}
            onClick={() => setActiveFilter(i)}
            className={cn(
              "rounded-lg border px-3 py-[7px] text-xs font-medium transition-colors",
              i === activeFilter
                ? "border-transparent bg-[var(--es-neutral-900)] text-white"
                : "border-[var(--es-neutral-300)] bg-card text-muted-foreground hover:bg-muted",
            )}
          >
            {f}
          </button>
        ))}
        <div className="flex-1" />
        <button className="flex items-center gap-1.5 rounded-lg border border-[var(--es-neutral-300)] bg-card px-3 py-[7px] text-xs font-medium text-muted-foreground transition-colors hover:bg-muted">
          <Download className="size-3.5" /> Export CSV
        </button>
        <button className="flex items-center gap-1.5 rounded-lg bg-[var(--es-accent-600)] px-3.5 py-[7px] text-xs font-semibold text-white transition-colors hover:bg-[var(--es-accent-700)]">
          <Plus className="size-3.5" /> Add employee
        </button>
      </div>

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
        {employees.map((p) => (
          <div
            key={p.code}
            className="grid grid-cols-[100px_1fr_140px_110px_140px_110px_110px_40px] items-center border-t border-[var(--es-neutral-100)] px-4 py-3 text-[13px]"
          >
            <span className="tabular-nums text-xs text-muted-foreground">
              {p.code}
            </span>
            <div>
              <div className="font-medium">{p.name}</div>
              <div className="text-[11px] text-muted-foreground">{p.email}</div>
            </div>
            <span>{p.dept}</span>
            <RoleBadge role={p.role} />
            <span className="text-xs text-muted-foreground">{p.manager}</span>
            <StatusPill tone={statusTone[p.status] ?? "neutral"}>
              {p.status}
            </StatusPill>
            <span className="tabular-nums text-xs text-muted-foreground">
              {p.start}
            </span>
            <button className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted">
              <MoreHorizontal className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
