"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ChevronsUpDown, LogOut, Menu } from "lucide-react";
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
}

function isGroup(item: NavItem | NavGroup): item is NavGroup {
  return "group" in item;
}

export function AdminSidebar({ items, role, userName, userInitials, onNavClick }: AdminSidebarProps) {
  const pathname = usePathname();
  const t = useT();

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

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "group/user mt-auto flex w-full cursor-pointer items-center gap-2 rounded-md p-1.5 text-left transition-colors",
            "hover:bg-muted/60 data-popup-open:bg-muted/60",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50",
          )}
          aria-label={t.common.signOut}
        >
          <div className="es-brand-gradient grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white">{userInitials}</div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-xs font-medium">{userName}</div>
            <div className="truncate text-[10px] text-muted-foreground">{role}</div>
          </div>
          <ChevronsUpDown
            className="size-3.5 shrink-0 text-muted-foreground/60 transition-colors group-hover/user:text-muted-foreground"
            aria-hidden="true"
          />
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
