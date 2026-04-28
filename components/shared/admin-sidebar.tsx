"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/shared/notification-bell";
import { RoleBadge } from "@/components/shared/role-badge";
import { StatusPill } from "@/components/shared/status-pill";

export interface NavItem {
  key: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: string;
}

export interface NavGroup { group: string }

interface AdminSidebarProps {
  items: (NavItem | NavGroup)[];
  role: string;
  userName: string;
  userInitials: string;
  onNavClick?: () => void;
}

function isGroup(item: NavItem | NavGroup): item is NavGroup {
  return "group" in item;
}

export function AdminSidebar({ items, role, userName, userInitials, onNavClick }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[var(--es-sidebar-width)] shrink-0 flex-col gap-1 border-r border-border bg-card px-3 py-4">
      <div className="flex items-center gap-2.5 px-2 pb-4">
        <div className="es-brand-gradient grid size-7 place-items-center rounded-lg text-[13px] font-extrabold text-white">ES</div>
        <div>
          <div className="text-sm font-bold tracking-tight">{process.env.NEXT_PUBLIC_APP_NAME ?? "EasySlip"}</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">HR Portal</div>
        </div>
      </div>

      {items.map((item, i) => {
        if (isGroup(item)) {
          return <div key={`g-${i}`} className="px-2.5 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground">{item.group}</div>;
        }
        const active = pathname.startsWith(item.href);
        return (
          <Link key={item.key} href={item.href} onClick={onNavClick} className={cn(
            "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
            active ? "bg-[var(--es-accent-50)] font-semibold text-[var(--es-accent-700)]" : "text-muted-foreground hover:bg-muted",
          )}>
            <item.icon className="size-[18px]" />
            <span className="flex-1">{item.label}</span>
            {item.badge && <StatusPill tone="error" dot={false}>{item.badge}</StatusPill>}
          </Link>
        );
      })}

      <div className="mt-auto flex items-center gap-2.5 border-t border-[var(--es-neutral-100)] px-2 pt-3">
        <div className="es-brand-gradient grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white">{userInitials}</div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-semibold">{userName}</div>
          <RoleBadge role={role} />
        </div>
      </div>
    </aside>
  );
}

interface AdminTopbarProps {
  title: string;
  subtitle?: string;
  role: string;
  actions?: React.ReactNode;
  onMenuClick?: () => void;
}

export function AdminTopbar({ title, subtitle, role, actions, onMenuClick }: AdminTopbarProps) {
  return (
    <header className="safe-area-pt sticky top-0 z-20 flex h-[60px] shrink-0 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/80 lg:px-6">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button onClick={onMenuClick} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted lg:hidden" aria-label="Menu">
            <Menu className="size-5" />
          </button>
        )}
        <div>
          <h1 className="text-lg font-bold tracking-tight lg:text-[22px]">{title}</h1>
          {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <NotificationBell />
        <RoleBadge role={role} className="hidden sm:inline-flex" />
      </div>
    </header>
  );
}
