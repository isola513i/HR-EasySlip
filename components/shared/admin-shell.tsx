"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import {
  AdminSidebar,
  type NavItem,
  type NavGroup,
} from "@/components/shared/admin-sidebar";
import { AdminHeader } from "@/components/shared/admin-header";
import { useT } from "@/lib/i18n/locale-context";

const SIDEBAR_COLLAPSED_KEY = "es-sidebar-collapsed";

interface AdminShellProps {
  navItems: (NavItem | NavGroup)[];
  defaultTitle: string;
  user: { name: string; role: string };
  inboxHref?: string;
  children: React.ReactNode;
}

export function AdminShell({ navItems, defaultTitle, user, inboxHref, children }: AdminShellProps) {
  const t = useT();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setCollapsed(window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1");
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        // localStorage unavailable (private mode etc.)
      }
      return next;
    });
  };

  const userName = user.name || defaultTitle;
  const initials = (user.name || defaultTitle).slice(0, 2);

  const sidebarProps = {
    items: navItems,
    role: user.role,
    userName,
  };

  return (
    <div className="flex min-h-dvh bg-background">
      <div className="sticky top-0 hidden h-dvh self-start lg:block">
        <AdminSidebar
          {...sidebarProps}
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
          onNavClick={() => {}}
        />
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[min(85vw,260px)] p-0" showCloseButton={false}>
          <SheetTitle className="sr-only">{t.common.menu}</SheetTitle>
          <SheetDescription className="sr-only">{defaultTitle}</SheetDescription>
          <AdminSidebar {...sidebarProps} onNavClick={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader
          user={{ name: userName, role: user.role, initials }}
          onMenuClick={() => setMobileOpen(true)}
          inboxHref={inboxHref}
        />
        <main className="min-w-0 flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
