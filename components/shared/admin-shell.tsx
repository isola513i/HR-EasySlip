"use client";

import { usePathname } from "next/navigation";
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

export function AdminShell({
  navItems,
  pageTitles,
  defaultTitle,
  user,
  children,
}: AdminShellProps) {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? defaultTitle;
  const initials = user.name.slice(0, 2) || defaultTitle.slice(0, 2);

  return (
    <div className="flex min-h-dvh bg-background">
      <AdminSidebar
        items={navItems}
        role={user.role}
        userName={user.name || defaultTitle}
        userInitials={initials}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar title={title} role={user.role} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
