"use client";

import {
  LayoutGrid,
  Users,
  FileBarChart,
  CalendarDays,
  CalendarCheck,
  ShieldCheck,
  Scroll,
  Settings,
  Clock,
  Banknote,
  Coins,
  Network,
  Boxes,
} from "lucide-react";
import { AdminShell } from "@/components/shared/admin-shell";
import type { NavItem, NavGroup } from "@/components/shared/admin-sidebar";
import { useT } from "@/lib/i18n/locale-context";

interface Props {
  user: { id: string; name: string; role: string };
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
    { key: "orgChart", href: "/hr/org-chart", icon: Network, label: nav.orgChart },
    { key: "leave", href: "/hr/leave", icon: CalendarDays, label: nav.leave },
    { key: "attendance", href: "/hr/attendance", icon: Clock, label: nav.attendance },
    { key: "overtime", href: "/hr/overtime", icon: Clock, label: nav.overtime },
    { key: "holidays", href: "/hr/holidays", icon: CalendarCheck, label: nav.holidays },
    { key: "assets", href: "/hr/assets", icon: Boxes, label: nav.assets },
    { group: nav.groupPayroll },
    { key: "payroll", href: "/hr/payroll", icon: Banknote, label: nav.payroll },
    { key: "cashout", href: "/hr/payroll/cashout", icon: Coins, label: nav.cashout },
    { key: "reports", href: "/hr/reports", icon: FileBarChart, label: nav.reports },
    { group: nav.groupCompliance },
    { key: "audit", href: "/hr/audit", icon: Scroll, label: nav.audit },
    { key: "pdpa", href: "/hr/pdpa", icon: ShieldCheck, label: nav.pdpa },
    { group: nav.groupSystem },
    { key: "settings", href: "/hr/settings", icon: Settings, label: nav.settings },
  ];

  return (
    <AdminShell
      navItems={navItems}
      defaultTitle={nav.defaultTitle}
      user={user}
      inboxHref="/hr/audit"
    >
      {children}
    </AdminShell>
  );
}
