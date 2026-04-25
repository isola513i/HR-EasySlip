"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  AdminSidebar,
  AdminTopbar,
  type NavItem,
  type NavGroup,
} from "@/components/shared/admin-sidebar";

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
  const title = pageTitles[pathname] ?? defaultTitle;
  const initials = user.name.slice(0, 2) || defaultTitle.slice(0, 2);

  const sidebarProps = { items: navItems, role: user.role, userName: user.name || defaultTitle, userInitials: initials };

  return (
    <div className="flex min-h-dvh bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar {...sidebarProps} onNavClick={() => {}} />
      </div>

      {/* Mobile sidebar drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[260px] p-0">
          <AdminSidebar {...sidebarProps} onNavClick={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar title={title} role={user.role} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
