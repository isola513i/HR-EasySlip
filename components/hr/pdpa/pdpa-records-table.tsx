"use client";

import { FileText, Mail } from "lucide-react";
import { ScrollableTable } from "@/components/shared/scrollable-table";
import { StatusPill } from "@/components/shared/status-pill";
import { EmployeeAvatar } from "@/components/hr/attendance/employee-avatar";
import { getInitials } from "@/lib/employee/initials";
import { openMailto } from "@/lib/email/open-mailto";
import { useT } from "@/lib/i18n/locale-context";
import { useFormat } from "@/hooks/use-format";
import type { PdpaOverview } from "@/lib/consent/consent-service";
import type { ConsentStatus } from "@/lib/consent/categories";

const GRID = "grid-cols-[1.5fr_120px_1.5fr_140px_120px_120px_100px]";

const STATUS_TONE: Record<ConsentStatus, "success" | "warn" | "error" | "neutral"> = {
  CONSENTED: "success",
  PENDING: "warn",
  PARTIAL: "error",
  WITHDRAWN: "neutral",
};

type PdpaRecord = PdpaOverview["records"][number];

interface Props {
  records: PdpaRecord[];
}

export function PdpaRecordsTable({ records }: Props) {
  const t = useT();
  const fmt = useFormat();

  const consentTypeLabel = (type: PdpaRecord["consentType"]) => {
    if (type === "ALL") return t.hr.pdpa.consentTypeAll;
    if (type === "BASIC") return t.hr.pdpa.consentTypeBasic;
    return t.hr.pdpa.consentTypeNone;
  };

  const statusLabel = (status: ConsentStatus) => {
    if (status === "CONSENTED") return t.hr.pdpa.statusConsented;
    if (status === "PENDING") return t.hr.pdpa.statusPending;
    if (status === "PARTIAL") return t.hr.pdpa.statusPartial;
    return t.hr.pdpa.statusWithdrawn;
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-[var(--es-shadow-sm)]">
      <div className="border-b border-border px-5 py-4">
        <div className="text-base font-semibold">{t.hr.pdpa.recordsTitle}</div>
      </div>

      {records.length === 0 ? (
        <div className="px-4 py-12 text-center text-sm text-muted-foreground">{t.hr.pdpa.recordsEmpty}</div>
      ) : (
        <ScrollableTable minWidth={1080}>
          <div className={`grid ${GRID} border-b border-border bg-[var(--es-neutral-50)] px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground`}>
            <span>{t.hr.pdpa.recordsEmployee}</span>
            <span>{t.hr.pdpa.recordsEmployeeId}</span>
            <span>{t.hr.pdpa.recordsEmail}</span>
            <span>{t.hr.pdpa.recordsConsentType}</span>
            <span>{t.hr.pdpa.recordsStatus}</span>
            <span>{t.hr.pdpa.recordsDate}</span>
            <span>{t.hr.pdpa.recordsActions}</span>
          </div>

          {records.map((r) => {
            const fullName = `${r.firstNameTh} ${r.lastNameTh}`.trim();
            const showReminder = r.status === "PENDING" || r.status === "WITHDRAWN";
            return (
              <div key={r.employeeId} className={`grid ${GRID} items-center border-b border-[var(--es-neutral-100)] px-5 py-3 text-[13px] last:border-b-0`}>
                <div className="flex min-w-0 items-center gap-2.5">
                  <EmployeeAvatar seed={r.employeeCode} initials={getInitials(r)} />
                  <span className="truncate font-semibold">{fullName}</span>
                </div>
                <span className="font-mono text-[12px] text-muted-foreground">{r.employeeCode}</span>
                <span className="truncate text-[var(--es-accent-600)]">
                  {r.email ?? "—"}
                </span>
                <span className="text-muted-foreground">{consentTypeLabel(r.consentType)}</span>
                <span>
                  <StatusPill tone={STATUS_TONE[r.status]} dot>{statusLabel(r.status)}</StatusPill>
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {r.grantedAt ? fmt.formatShortDate(r.grantedAt, "numeric") : "—"}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label={t.hr.pdpa.actionViewDocument}
                    title={t.hr.pdpa.actionViewDocument}
                    className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <FileText className="size-4" />
                  </button>
                  {showReminder && r.email && (
                    <button
                      type="button"
                      onClick={() => openMailto(r.email!)}
                      aria-label={t.hr.pdpa.actionSendReminder}
                      title={t.hr.pdpa.actionSendReminder}
                      className="grid size-8 place-items-center rounded-md text-[var(--es-accent-600)] transition-colors hover:bg-[var(--es-accent-50)]"
                    >
                      <Mail className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </ScrollableTable>
      )}
    </div>
  );
}
