"use client";

import {
  Inbox,
  Users,
  CalendarDays,
  Settings,
} from "lucide-react";
import { AdminShell } from "@/components/shared/admin-shell";
import type { NavItem, NavGroup } from "@/components/shared/admin-sidebar";
import { useT } from "@/lib/i18n/locale-context";

interface Props {
  user: { name: string; role: string };
  children: React.ReactNode;
}

export function ManagerShell({ user, children }: Props) {
  const t = useT();
  const nav = t.manager.nav;

  const navItems: (NavItem | NavGroup)[] = [
    { group: nav.groupOverview },
    { key: "inbox", href: "/manager/inbox", icon: Inbox, label: nav.inbox },
    { key: "team", href: "/manager/team", icon: Users, label: nav.team },
    { group: nav.groupPlanning },
    { key: "calendar", href: "/manager/calendar", icon: CalendarDays, label: nav.calendar },
    { key: "settings", href: "/manager/settings", icon: Settings, label: nav.settings },
  ];

  const pageTitles: Record<string, string> = {
    "/manager/inbox": nav.inbox,
    "/manager/team": nav.team,
    "/manager/calendar": nav.calendar,
    "/manager/settings": nav.settings,
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
