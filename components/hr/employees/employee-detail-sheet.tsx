"use client";

import { useState } from "react";
import { Calendar, Mail, Phone, ShieldCheck, User, Wallet } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/shared/status-pill";
import { RoleBadge } from "@/components/shared/role-badge";
import { EmployeeAvatar } from "@/components/hr/attendance/employee-avatar";
import { EmployeeDocumentsCard } from "@/components/hr/employees/documents/employee-documents-card";
import { SalaryInfoDialog } from "@/components/hr/employees/salary-info-dialog";
import { useT } from "@/lib/i18n/locale-context";
import { useFormat } from "@/hooks/use-format";
import { statusTone } from "@/lib/employee/status-tones";
import { getInitials } from "@/lib/employee/initials";
import { profilePictureSrc } from "@/hooks/use-profile-picture";
import type { Employee } from "@/hooks/use-employees";

interface Props {
  employee: Employee | null;
  onClose: () => void;
  onUpdated?: () => void;
}

export function EmployeeDetailSheet({ employee, onClose, onUpdated }: Props) {
  const t = useT();
  const fmt = useFormat();
  const [salaryOpen, setSalaryOpen] = useState(false);

  if (!employee) return null;

  // baseSalary is omitted from the API response when caller is not in
  // SENSITIVE_DATA_ROLES — use the field's presence as the gate signal.
  const canViewSalary = employee.baseSalary !== undefined;

  const name = `${employee.firstNameTh} ${employee.lastNameTh}`;
  const nameEn = [employee.firstNameEn, employee.lastNameEn].filter(Boolean).join(" ");

  return (
    <Sheet open={!!employee} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-[min(95vw,440px)] sm:max-w-[440px]">
        <SheetHeader>
          <SheetTitle>{t.hr.employees.detailTitle}</SheetTitle>
          <SheetDescription className="sr-only">{name}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-auto px-5 pb-5">
          <div className="flex flex-col items-center gap-2 border-b border-(--es-neutral-100) py-4 text-center">
            <EmployeeAvatar
              seed={employee.employeeCode}
              initials={getInitials(employee)}
              size="lg"
              pictureSrc={
                employee.hasProfilePicture
                  ? profilePictureSrc(employee.id, employee.profilePictureUploadedAt ?? null)
                  : null
              }
            />
            <div>
              <div className="text-[16px] font-semibold">{name}</div>
              {nameEn && <div className="text-[12px] text-muted-foreground">{nameEn}</div>}
              <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">{employee.employeeCode}</div>
            </div>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5">
              <RoleBadge role={employee.roles?.[0] ?? "EMPLOYEE"} />
              <StatusPill tone={statusTone(employee.employmentStatus)}>
                {employee.employmentStatus}
              </StatusPill>
            </div>
          </div>

          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 py-4 text-[13px]">
            <Field icon={Mail} label={t.hr.email} value={employee.user?.email ?? "—"} mono />
            <Field icon={Phone} label={t.profile.phone} value={employee.phone ?? "—"} />
            <Field icon={ShieldCheck} label={t.hr.department} value={employee.department?.name ?? "—"} />
            <Field icon={User} label={t.hr.employees.colPosition} value={employee.position?.name ?? "—"} />
            <Field
              icon={User}
              label={t.hr.employees.colType}
              value={
                employee.employmentType
                  ? t.hr.employees.employmentTypes[employee.employmentType]
                  : "—"
              }
            />
            <Field
              icon={Calendar}
              label={t.hr.start}
              value={employee.hireDate ? fmt.formatShortDate(employee.hireDate, "numeric") : "—"}
            />
            <Field
              icon={User}
              label={t.hr.manager}
              value={employee.manager ? `${employee.manager.firstNameTh} ${employee.manager.lastNameTh}` : "—"}
            />
          </dl>

          {canViewSalary && (
            <div className="border-t border-(--es-neutral-100) pt-4">
              <Button variant="outline" onClick={() => setSalaryOpen(true)} className="w-full gap-1.5">
                <Wallet className="size-4" /> {t.hr.employees.salaryInfoBtn}
              </Button>
            </div>
          )}

          <div className="border-t border-(--es-neutral-100) pt-4">
            <EmployeeDocumentsCard employeeId={employee.id} />
          </div>
        </div>
      </SheetContent>

      {salaryOpen && (
        <SalaryInfoDialog
          employee={employee}
          onClose={() => setSalaryOpen(false)}
          onUpdated={() => { onUpdated?.(); }}
        />
      )}
    </Sheet>
  );
}

function Field({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <>
      <dt className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </dt>
      <dd className={`text-right font-medium ${mono ? "font-mono text-[12px]" : ""}`}>{value}</dd>
    </>
  );
}
