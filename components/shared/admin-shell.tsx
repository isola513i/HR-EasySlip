"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  AdminSidebar,
  AdminTopbar,
  type NavItem,
  type NavGroup,
} from "@/components/shared/admin-sidebar";

const SIDEBAR_COLLAPSED_KEY = "es-sidebar-collapsed";

interface AdminShellProps {
  navItems: (NavItem | NavGroup)[];
  pageTitles: Record<string, string>;
  defaultTitle: string;
  user: { name: string; role: string };
  children: React.ReactNode;
}

export function AdminShell({ navItems, pageTitles, defaultTitle, user, children }: AdminShellProps) {
  const pathname = usePathname();
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
        // localStorage unavailable (private mode etc.) — non-critical
      }
      return next;
    });
  };

  const title = pageTitles[pathname] ?? defaultTitle;
  const initials = user.name.slice(0, 2) || defaultTitle.slice(0, 2);

  const sidebarProps = { items: navItems, role: user.role, userName: user.name || defaultTitle, userInitials: initials };

  return (
    <div className="flex min-h-dvh bg-background">
      {/* Desktop sidebar */}
      <div className="sticky top-0 hidden h-dvh self-start lg:block">
        <AdminSidebar
          {...sidebarProps}
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
          onNavClick={() => {}}
        />
      </div>

      {/* Mobile sidebar drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[min(85vw,260px)] p-0">
          <AdminSidebar {...sidebarProps} onNavClick={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar
          title={title}
          role={user.role}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-auto overscroll-contain p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
