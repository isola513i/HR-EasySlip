"use client";

import { Eye, KeyRound, Mail } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import type { Employee } from "@/hooks/use-employees";

interface Props {
  employee: Employee;
  name: string;
  onView: (e: Employee) => void;
  onResetPassword: (e: Employee) => void;
  onSendEmail: (e: Employee) => void;
}

const BTN = "grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

export function EmployeeRowActions({ employee, name, onView, onResetPassword, onSendEmail }: Props) {
  const t = useT();
  return (
    <>
      <button type="button" onClick={() => onView(employee)} title={t.hr.employees.actionView} aria-label={`${t.hr.employees.actionView} ${name}`} className={BTN}>
        <Eye className="size-4" />
      </button>
      <button type="button" onClick={() => onResetPassword(employee)} title={t.hr.employees.actionResetPassword} aria-label={`${t.hr.employees.actionResetPassword} ${name}`} className={BTN}>
        <KeyRound className="size-4" />
      </button>
      <button type="button" onClick={() => onSendEmail(employee)} title={t.hr.employees.actionEmail} aria-label={`${t.hr.employees.actionEmail} ${name}`} className={BTN}>
        <Mail className="size-4" />
      </button>
    </>
  );
}
