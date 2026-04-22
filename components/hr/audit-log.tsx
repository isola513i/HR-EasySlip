import { CalendarDays, Filter, Download } from "lucide-react";
import { StatusPill } from "@/components/shared/status-pill";
import { RoleBadge } from "@/components/shared/role-badge";
import { SearchInput } from "@/components/shared/search-input";

const rows = [
  { time: "09:14", actor: "Weeraya Sangjan", role: "HR_AUTHORIZED", action: "leave.approve", target: "Req #8821 (ES0042)", ip: "10.0.12.4", ok: true },
  { time: "09:12", actor: "Pakin Wongsa", role: "MANAGER", action: "leave.reject", target: "Req #8819 (ES0061)", ip: "10.0.12.18", ok: true },
  { time: "09:05", actor: "system", role: "ADMIN", action: "attendance.late_flag", target: "ES0027 @ 09:23", ip: "—", ok: true },
  { time: "08:51", actor: "Apinya Sakulrat", role: "HRMG", action: "user.role_change", target: "ES0055: EMP→MANAGER", ip: "10.0.12.2", ok: true },
  { time: "08:44", actor: "Pakin Wongsa", role: "MANAGER", action: "login", target: "Magic link · gmail", ip: "10.0.12.18", ok: true },
  { time: "08:30", actor: "system", role: "ADMIN", action: "consent.pdpa_prompt", target: "ES0070", ip: "—", ok: true },
  { time: "08:12", actor: "Preecha Jaidee", role: "EMPLOYEE", action: "login.failed", target: "Bad magic link", ip: "203.0.113.4", ok: false },
  { time: "07:58", actor: "Weeraya Sangjan", role: "HR_AUTHORIZED", action: "export.csv", target: "leave_april_2026.csv", ip: "10.0.12.4", ok: true },
];

export function AuditLog() {
  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2.5">
        <SearchInput placeholder="Search action, actor, target..." className="max-w-[360px]" />
        <button className="flex items-center gap-1.5 rounded-lg border border-[var(--es-neutral-300)] bg-card px-3 py-[7px] text-xs font-medium text-muted-foreground transition-colors hover:bg-muted">
          <CalendarDays className="size-3.5" /> Today
        </button>
        <button className="flex items-center gap-1.5 rounded-lg border border-[var(--es-neutral-300)] bg-card px-3 py-[7px] text-xs font-medium text-muted-foreground transition-colors hover:bg-muted">
          <Filter className="size-3.5" /> Actor role
        </button>
        <div className="flex-1" />
        <button className="flex items-center gap-1.5 rounded-lg border border-[var(--es-neutral-300)] bg-card px-3 py-[7px] text-xs font-medium text-muted-foreground transition-colors hover:bg-muted">
          <Download className="size-3.5" /> Export
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--es-shadow-sm)]">
        <div className="grid grid-cols-[80px_1fr_110px_180px_1.2fr_120px_70px] border-b border-border bg-[var(--es-neutral-50)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          <span>Time</span>
          <span>Actor</span>
          <span>Role</span>
          <span>Action</span>
          <span>Target</span>
          <span>IP</span>
          <span>Status</span>
        </div>
        {rows.map((r, i) => (
          <div
            key={i}
            className="grid grid-cols-[80px_1fr_110px_180px_1.2fr_120px_70px] items-center border-t border-[var(--es-neutral-100)] px-4 py-3 text-[13px]"
          >
            <span className="tabular-nums text-muted-foreground">
              {r.time}
            </span>
            <span>{r.actor}</span>
            <RoleBadge role={r.role} />
            <code className="rounded bg-[var(--es-accent-50)] px-[7px] py-[2px] font-mono text-xs text-[var(--es-accent-700)]">
              {r.action}
            </code>
            <span className="font-mono text-xs text-muted-foreground">
              {r.target}
            </span>
            <span className="tabular-nums text-xs text-muted-foreground">
              {r.ip}
            </span>
            <StatusPill tone={r.ok ? "success" : "error"}>
              {r.ok ? "OK" : "FAIL"}
            </StatusPill>
          </div>
        ))}
      </div>
    </div>
  );
}
