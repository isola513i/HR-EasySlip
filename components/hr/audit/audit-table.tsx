"use client";

import {
  CalendarCheck,
  CalendarX,
  Download,
  FileText,
  ScrollText,
  Settings as SettingsIcon,
  ShieldX,
  User,
  UserPlus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollableTable } from "@/components/shared/scrollable-table";
import { EmployeeAvatar } from "@/components/hr/attendance/employee-avatar";
import { categorizeAction, moduleForEntity, type AuditModule } from "@/lib/audit/categories";
import { getActionLabel } from "@/lib/audit/action-labels";
import { useT } from "@/lib/i18n/locale-context";
import { useFormat } from "@/hooks/use-format";
import { useLocale } from "@/hooks/use-locale";
import type { AuditEntry } from "@/hooks/use-audit-logs";

const GRID = "grid-cols-[180px_minmax(180px,1fr)_minmax(180px,1.2fr)_120px_180px_140px]";

const MODULE_TONE: Record<AuditModule, string> = {
  EMPLOYEES: "bg-[var(--es-accent-50)] text-[var(--es-accent-700)]",
  LEAVE: "bg-[var(--es-info-50)] text-[var(--es-info-600)]",
  ATTENDANCE: "bg-[var(--es-success-50)] text-[var(--es-success-700)]",
  OVERTIME: "bg-[var(--es-warn-50)] text-[var(--es-warn-600)]",
  PAYROLL: "bg-[#f3e8ff] text-[#7e22ce]",
  REPORTS: "bg-[var(--es-info-50)] text-[var(--es-info-600)]",
  SETTINGS: "bg-[var(--es-neutral-100)] text-[var(--es-neutral-700)]",
  OTHER: "bg-[var(--es-neutral-100)] text-[var(--es-neutral-700)]",
};

function actionIcon(action: string): { Icon: LucideIcon; isDelete: boolean } {
  const cat = categorizeAction(action);
  if (cat === "DELETE") return { Icon: ShieldX, isDelete: true };
  if (cat === "EXPORT") return { Icon: Download, isDelete: false };
  if (cat === "CREATE") return { Icon: UserPlus, isDelete: false };
  if (action.includes(".approve")) return { Icon: CalendarCheck, isDelete: false };
  if (action.includes(".reject")) return { Icon: CalendarX, isDelete: false };
  if (action.startsWith("auth.")) return { Icon: User, isDelete: false };
  if (action.startsWith("settings.")) return { Icon: SettingsIcon, isDelete: false };
  return { Icon: FileText, isDelete: false };
}

function actorName(entry: AuditEntry): string {
  return entry.actor?.email?.split("@")[0] ?? entry.actorId;
}

function actorInitials(entry: AuditEntry): string {
  const n = actorName(entry);
  const parts = n.split(/[._\-\s]/).filter(Boolean);
  if (parts.length >= 2) return parts[0][0] + parts[1][0];
  return n.slice(0, 2);
}

function targetLabel(entry: AuditEntry): string {
  const id = entry.entityId.length > 12 ? `${entry.entityId.slice(0, 8)}` : entry.entityId;
  return `${entry.entityType} #${id}`;
}

interface Props {
  rows: AuditEntry[];
  isLoading: boolean;
  error: string | null;
}

export function AuditTable({ rows, isLoading, error }: Props) {
  const t = useT();
  const fmt = useFormat();
  const { locale } = useLocale();

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--es-shadow-sm)]">
      <ScrollableTable minWidth={1080}>
        <div className={`grid ${GRID} border-b border-border bg-[var(--es-neutral-50)] px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground`}>
          <span>{t.hr.audit.colUser}</span>
          <span>{t.hr.audit.colAction}</span>
          <span>{t.hr.audit.colTarget}</span>
          <span>{t.hr.audit.colModule}</span>
          <span>{t.hr.audit.colTimestamp}</span>
          <span>{t.hr.audit.colIP}</span>
        </div>

        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`grid ${GRID} items-center border-b border-[var(--es-neutral-100)] px-5 py-3.5`}>
              <div className="flex items-center gap-2.5"><Skeleton className="size-9 rounded-full" /><Skeleton className="h-4 w-24" /></div>
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}

        {!isLoading && error && (
          <div className="px-4 py-8 text-center text-sm text-destructive">{error}</div>
        )}

        {!isLoading && !error && rows.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <ScrollText className="size-10 opacity-40" />
            <p className="text-sm">{t.hr.noAuditLogs}</p>
          </div>
        )}

        {!isLoading && !error && rows.map((r) => {
          const name = actorName(r);
          const initials = actorInitials(r);
          const { Icon, isDelete } = actionIcon(r.action);
          const m = moduleForEntity(r.entityType);
          return (
            <div key={r.id} className={`grid ${GRID} items-center border-b border-[var(--es-neutral-100)] px-5 py-3.5 text-[13px] last:border-b-0 hover:bg-muted/40`}>
              <div className="flex min-w-0 items-center gap-2.5">
                <EmployeeAvatar seed={r.actorId} initials={initials} />
                <span className="truncate font-medium">{name}</span>
              </div>
              <div className="flex min-w-0 items-center gap-2">
                <Icon className={`size-4 shrink-0 ${isDelete ? "text-[var(--es-error-500)]" : "text-muted-foreground"}`} />
                <span className="truncate">{getActionLabel(r.action, locale)}</span>
              </div>
              <div className="truncate font-mono text-[12px] text-muted-foreground" title={`${r.entityType}#${r.entityId}`}>
                {targetLabel(r)}
              </div>
              <div>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${MODULE_TONE[m]}`}>
                  {t.hr.audit.modules[m]}
                </span>
              </div>
              <div className="tabular-nums text-muted-foreground">{fmt.formatDateTime(r.createdAt)}</div>
              <div className="tabular-nums text-muted-foreground font-mono text-[12px]">{r.ipAddress ?? "—"}</div>
            </div>
          );
        })}
      </ScrollableTable>
    </div>
  );
}
