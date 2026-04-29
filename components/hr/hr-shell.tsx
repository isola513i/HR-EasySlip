"use client";

import {
  LayoutGrid,
  Users,
  ClipboardCheck,
  FileBarChart,
  CalendarDays,
  CalendarCheck,
  ShieldCheck,
  Scroll,
  Settings,
  Clock,
  Banknote,
} from "lucide-react";
import { AdminShell } from "@/components/shared/admin-shell";
import type { NavItem, NavGroup } from "@/components/shared/admin-sidebar";
import { useT } from "@/lib/i18n/locale-context";

interface Props {
  user: { name: string; role: string };
  children: React.ReactNode;
}

export function HRShell({ user, children }: Props) {
  const t = useT();
  const nav = t.hr.nav;

  const navItems: (NavItem | NavGroup)[] = [
    { group: nav.groupDashboard },
    { key: "overview", href: "/hr/overview", icon: LayoutGrid, label: nav.overview },
    { group: nav.groupPeople },
    { key: "employees", href: "/hr/employees", icon: Users, label: nav.employees },
    { key: "onboarding", href: "/hr/onboarding", icon: ClipboardCheck, label: nav.onboarding },
    { key: "leave", href: "/hr/leave-calendar", icon: CalendarDays, label: nav.leaveCalendar },
    { key: "attendance", href: "/hr/attendance", icon: Clock, label: nav.attendance },
    { key: "overtime", href: "/hr/overtime", icon: Clock, label: nav.overtime },
    { key: "holidays", href: "/hr/holidays", icon: CalendarCheck, label: nav.holidays },
    { group: nav.groupPayroll },
    { key: "payroll", href: "/hr/payroll", icon: Banknote, label: nav.payroll },
    { key: "reports", href: "/hr/reports", icon: FileBarChart, label: nav.reports },
    { group: nav.groupCompliance },
    { key: "audit", href: "/hr/audit", icon: Scroll, label: nav.audit },
    { key: "pdpa", href: "/hr/pdpa", icon: ShieldCheck, label: nav.pdpa },
    { group: nav.groupSystem },
    { key: "settings", href: "/hr/settings", icon: Settings, label: nav.settings },
  ];

  const pageTitles: Record<string, string> = {
    "/hr/overview": nav.overview,
    "/hr/employees": nav.employees,
    "/hr/onboarding": nav.onboarding,
    "/hr/leave-calendar": nav.leaveCalendar,
    "/hr/attendance": nav.attendance,
    "/hr/overtime": nav.overtime,
    "/hr/holidays": nav.holidays,
    "/hr/payroll": nav.payroll,
    "/hr/reports": nav.reports,
    "/hr/audit": nav.audit,
    "/hr/pdpa": nav.pdpa,
    "/hr/settings": nav.settings,
  };

  return (
    <AdminShell
      navItems={navItems}
      pageTitles={pageTitles}
      defaultTitle={nav.defaultTitle}
      user={user}
    >
      {children}
    </AdminShell>
  );
}
