"use client";

import {
  LayoutGrid,
  Users,
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

const navItems: (NavItem | NavGroup)[] = [
  { group: "Dashboard" },
  {
    key: "overview",
    href: "/hr/overview",
    icon: LayoutGrid,
    label: "Overview",
  },
  { group: "People" },
  {
    key: "employees",
    href: "/hr/employees",
    icon: Users,
    label: "Employees",
  },
  {
    key: "leave",
    href: "/hr/leave-calendar",
    icon: CalendarDays,
    label: "Leave Calendar",
  },
  {
    key: "attendance",
    href: "/hr/attendance",
    icon: Clock,
    label: "Attendance",
  },
  {
    key: "holidays",
    href: "/hr/holidays",
    icon: CalendarCheck,
    label: "Public Holidays",
  },
  { group: "Payroll" },
  {
    key: "payroll",
    href: "/hr/payroll",
    icon: Banknote,
    label: "Payroll Export",
  },
  { group: "Compliance" },
  {
    key: "audit",
    href: "/hr/audit",
    icon: Scroll,
    label: "Audit Log",
  },
  {
    key: "pdpa",
    href: "/hr/pdpa",
    icon: ShieldCheck,
    label: "PDPA Consent",
  },
  { group: "System" },
  {
    key: "settings",
    href: "/hr/settings",
    icon: Settings,
    label: "Settings",
  },
];

const pageTitles: Record<string, string> = {
  "/hr/overview": "Overview",
  "/hr/employees": "Employees",
  "/hr/leave-calendar": "Leave Calendar",
  "/hr/attendance": "Attendance",
  "/hr/holidays": "Public Holidays",
  "/hr/payroll": "Payroll Export",
  "/hr/audit": "Audit Log",
  "/hr/pdpa": "PDPA Consent",
  "/hr/settings": "Settings",
};

interface Props {
  user: { name: string; role: string };
  children: React.ReactNode;
}

export function HRShell({ user, children }: Props) {
  return (
    <AdminShell
      navItems={navItems}
      pageTitles={pageTitles}
      defaultTitle="HR Admin"
      user={user}
    >
      {children}
    </AdminShell>
  );
}
