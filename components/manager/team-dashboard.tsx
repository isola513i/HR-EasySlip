import { Download, MoreHorizontal } from "lucide-react";
import { StatusPill } from "@/components/shared/status-pill";
import { StatCard } from "@/components/shared/stat-card";

const kpis = [
  { label: "Checked in", value: "5 / 7", tone: "success" as const, sub: "71% · above target" },
  { label: "On leave today", value: "1", tone: "info" as const, sub: "1 annual leave" },
  { label: "Late", value: "1", tone: "warn" as const, sub: "More than 15 min" },
  { label: "Pending approvals", value: "5", tone: "error" as const, sub: "Action required" },
];

const team = [
  { name: "Suda Thongdee", code: "ES0042", status: "in" as const, time: "09:02", loc: "WFH" },
  { name: "Nattapol Kaewcharoen", code: "ES0018", status: "leave" as const, time: "Annual leave", loc: "Apr 28–30" },
  { name: "Piyanuch Seedum", code: "ES0031", status: "in" as const, time: "08:55", loc: "Office" },
  { name: "Anon Chokdee", code: "ES0027", status: "late" as const, time: "09:23", loc: "Office" },
  { name: "Malee Suayngam", code: "ES0055", status: "absent" as const, time: "—", loc: "Not on leave" },
  { name: "Somchai Ruayluea", code: "ES0061", status: "in" as const, time: "09:00", loc: "Office" },
  { name: "Weeraya Sangjan", code: "ES0064", status: "in" as const, time: "08:47", loc: "WFH" },
];

const statusConfig = {
  in: { tone: "success" as const, label: "Checked in" },
  leave: { tone: "info" as const, label: "On leave" },
  late: { tone: "warn" as const, label: "Late" },
  absent: { tone: "error" as const, label: "Absent" },
};

const dateStr = new Date().toLocaleDateString("en-US", {
  weekday: "long",
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function TeamDashboard() {
  return (
    <div className="flex flex-col gap-5">
      {/* KPI tiles */}
      <div className="grid grid-cols-4 gap-3.5">
        {kpis.map((k) => (
          <StatCard key={k.label} {...k} />
        ))}
      </div>

      {/* Team table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--es-shadow-sm)]">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div>
            <div className="text-[15px] font-semibold">Team today</div>
            <div className="text-xs text-muted-foreground">{dateStr}</div>
          </div>
          <button className="flex items-center gap-1.5 rounded-md border border-[var(--es-neutral-300)] bg-card px-3 py-[7px] text-xs font-medium text-muted-foreground transition-colors hover:bg-muted">
            <Download className="size-3.5" /> Export CSV
          </button>
        </div>

        <div className="grid grid-cols-[1fr_120px_120px_140px_80px] bg-[var(--es-neutral-50)] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          <span>Member</span>
          <span>Status</span>
          <span>Time</span>
          <span>Location</span>
          <span />
        </div>

        {team.map((p) => {
          const cfg = statusConfig[p.status];
          return (
            <div key={p.code} className="grid grid-cols-[1fr_120px_120px_140px_80px] items-center border-t border-[var(--es-neutral-100)] px-5 py-3 text-[13px]">
              <div className="flex items-center gap-2.5">
                <div className="grid size-8 place-items-center rounded-full bg-[var(--es-neutral-100)] text-[11px] font-bold text-muted-foreground">
                  {p.name.charAt(0)}
                </div>
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">{p.code}</div>
                </div>
              </div>
              <StatusPill tone={cfg.tone}>{cfg.label}</StatusPill>
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
