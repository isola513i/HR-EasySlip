"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ChevronsUpDown, LogOut, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/shared/notification-bell";
import { RoleBadge } from "@/components/shared/role-badge";
import { StatusPill } from "@/components/shared/status-pill";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useT } from "@/lib/i18n/locale-context";

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
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

function isGroup(item: NavItem | NavGroup): item is NavGroup {
  return "group" in item;
}

export function AdminSidebar({ items, role, userName, userInitials, onNavClick, collapsed = false, onToggleCollapsed }: AdminSidebarProps) {
  const pathname = usePathname();
  const t = useT();
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;
  const homeHref = items.find((item): item is NavItem => !isGroup(item))?.href ?? "/";

  return (
    <aside
      data-collapsed={collapsed ? "true" : "false"}
      className={cn(
        "flex h-full shrink-0 flex-col gap-1 overflow-hidden border-r border-border bg-card py-4",
        "transition-[width] duration-200 ease-out [will-change:width]",
        collapsed ? "w-[64px] px-2" : "w-[var(--es-sidebar-width)] px-3",
      )}
    >
      <div className={cn(
        "flex items-center pb-4",
        collapsed ? "justify-center px-0" : "gap-2.5 px-2",
      )}>
        {!collapsed && (
          <Link
            href={homeHref}
            onClick={onNavClick}
            aria-label={t.common.goToDashboard}
            className="-mx-1 flex min-w-0 items-center gap-2.5 rounded-md px-1 py-0.5 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50"
          >
            <Image
              src="/favicons/apple-touch-icon.png"
              alt="EasySlip"
              width={28}
              height={28}
              className="size-7 shrink-0 rounded-lg"
              priority
            />
            <div className="min-w-0">
              <div className="truncate text-sm font-bold tracking-tight">{process.env.NEXT_PUBLIC_APP_NAME ?? "EasySlip"}</div>
              <div className="truncate text-[10px] uppercase tracking-widest text-muted-foreground">HR Portal</div>
            </div>
          </Link>
        )}
        {onToggleCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? t.common.expandSidebar : t.common.collapseSidebar}
            title={collapsed ? t.common.expandSidebar : t.common.collapseSidebar}
            className={cn(
              "inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50",
              collapsed ? "" : "ml-auto",
            )}
          >
            <ToggleIcon className="size-4" />
          </button>
        )}
      </div>

      {items.map((item, i) => {
        if (isGroup(item)) {
          if (collapsed) {
            return <div key={`g-${i}`} className="mx-2 my-2 h-px bg-border/60" aria-hidden="true" />;
          }
          return <div key={`g-${i}`} className="px-2.5 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground">{item.group}</div>;
        }
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.key}
            href={item.href}
            onClick={onNavClick}
            title={collapsed ? item.label : undefined}
            aria-label={collapsed ? item.label : undefined}
            className={cn(
              "relative flex items-center rounded-lg text-[13px] font-medium transition-colors",
              collapsed ? "size-9 justify-center self-center" : "w-full gap-2.5 px-2.5 py-2",
              active ? "bg-[var(--es-accent-50)] font-semibold text-[var(--es-accent-700)]" : "text-muted-foreground hover:bg-muted",
            )}
          >
            <item.icon className="size-[18px] shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge && <StatusPill tone="error" dot={false}>{item.badge}</StatusPill>}
              </>
            )}
            {collapsed && item.badge && (
              <span
                aria-hidden="true"
                className="absolute right-0.5 top-0.5 size-1.5 rounded-full bg-destructive"
              />
            )}
          </Link>
        );
      })}

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "group/user mt-auto flex cursor-pointer items-center rounded-md p-1.5 text-left transition-colors",
            "hover:bg-muted/60 data-popup-open:bg-muted/60",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50",
            collapsed ? "self-center" : "w-full gap-2",
          )}
          aria-label={collapsed ? userName : t.common.signOut}
          title={collapsed ? userName : undefined}
        >
          <div className="es-brand-gradient grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white">{userInitials}</div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-xs font-medium">{userName}</div>
                <div className="truncate text-[10px] text-muted-foreground">{role}</div>
              </div>
              <ChevronsUpDown
                className="size-3.5 shrink-0 text-muted-foreground/60 transition-colors group-hover/user:text-muted-foreground"
                aria-hidden="true"
              />
            </>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          side="top"
          sideOffset={6}
          className="min-w-[180px] p-1"
        >
          <DropdownMenuItem
            variant="destructive"
            onClick={() => signOut({ callbackUrl: "/signin" })}
            className="cursor-pointer gap-2 px-2 py-1.5 text-[13px] focus:bg-destructive/5 dark:focus:bg-destructive/15"
          >
            <LogOut className="size-4" />
            {t.common.signOut}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
