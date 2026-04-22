"use client";

import {
  Inbox,
  Users,
  CalendarDays,
  Settings,
} from "lucide-react";
import { AdminShell } from "@/components/shared/admin-shell";
import type { NavItem, NavGroup } from "@/components/shared/admin-sidebar";

const navItems: (NavItem | NavGroup)[] = [
  { group: "Overview" },
  {
    key: "inbox",
    href: "/manager/inbox",
    icon: Inbox,
    label: "Approval Inbox",
    badge: "5",
  },
  {
    key: "team",
    href: "/manager/team",
    icon: Users,
    label: "Team Today",
  },
  { group: "Planning" },
  {
    key: "calendar",
    href: "/manager/calendar",
    icon: CalendarDays,
    label: "Leave Calendar",
  },
  {
    key: "settings",
    href: "/manager/settings",
    icon: Settings,
    label: "Settings",
  },
];

const pageTitles: Record<string, string> = {
  "/manager/inbox": "Approval Inbox",
  "/manager/team": "Team Today",
  "/manager/calendar": "Leave Calendar",
  "/manager/settings": "Settings",
};

interface Props {
  user: { name: string; role: string };
  children: React.ReactNode;
}

export function ManagerShell({ user, children }: Props) {
  return (
    <AdminShell
      navItems={navItems}
      pageTitles={pageTitles}
      defaultTitle="Manager"
      user={user}
    >
      {children}
    </AdminShell>
  );
}
