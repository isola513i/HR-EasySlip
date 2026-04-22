"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { RoleBadge } from "@/components/shared/role-badge";
import { StatusPill } from "@/components/shared/status-pill";

export interface NavItem {
  key: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: string;
  badgeTone?: string;
}

export interface NavGroup {
  group: string;
}

interface AdminSidebarProps {
  items: (NavItem | NavGroup)[];
  role: string;
  userName: string;
  userInitials: string;
}

function isGroup(item: NavItem | NavGroup): item is NavGroup {
  return "group" in item;
}

export function AdminSidebar({
  items,
  role,
  userName,
  userInitials,
}: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex w-[var(--es-sidebar-width)] shrink-0 flex-col gap-1 border-r border-border bg-card px-3 py-4">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2 pb-4">
        <div className="es-brand-gradient grid size-7 place-items-center rounded-lg text-[13px] font-extrabold text-white">
          ES
        </div>
        <div>
          <div className="text-sm font-bold tracking-tight">EasySlip</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            HR Portal
          </div>
        </div>
      </div>

      {/* Nav items */}
      {items.map((item, i) => {
        if (isGroup(item)) {
          return (
            <div
              key={`g-${i}`}
              className="px-2.5 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground"
            >
              {item.group}
            </div>
          );
        }

        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
              active
                ? "bg-[var(--es-accent-50)] font-semibold text-[var(--es-accent-700)]"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <item.icon className="size-[18px]" />
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <StatusPill tone="error" dot={false}>
                {item.badge}
              </StatusPill>
            )}
          </Link>
        );
      })}

      {/* User footer */}
      <div className="mt-auto flex items-center gap-2.5 border-t border-[var(--es-neutral-100)] px-2 pt-3">
        <div className="es-brand-gradient grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white">
          {userInitials}
        </div>
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
}

export function AdminTopbar({
  title,
  subtitle,
  role,
  actions,
}: AdminTopbarProps) {
  return (
    <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-border bg-card px-6">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight">{title}</h1>
        {subtitle && (
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        )}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <button className="relative rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted" aria-label="Notifications">
          <Bell className="size-5" strokeWidth={1.75} />
          <span className="absolute right-1 top-1 size-1.5 rounded-full bg-[var(--es-error-500)]" />
        </button>
        <RoleBadge role={role} />
      </div>
    </header>
  );
}
