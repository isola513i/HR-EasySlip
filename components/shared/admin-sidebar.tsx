"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusPill } from "@/components/shared/status-pill";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LocaleToggle } from "@/components/shared/locale-toggle";
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
  onNavClick?: () => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

function isGroup(item: NavItem | NavGroup): item is NavGroup {
  return "group" in item;
}

export function AdminSidebar({ items, role, userName, onNavClick, collapsed = false, onToggleCollapsed }: AdminSidebarProps) {
  const pathname = usePathname();
  const t = useT();
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <aside
      data-collapsed={collapsed ? "true" : "false"}
      className={cn(
        "flex h-full shrink-0 flex-col overflow-hidden border-r border-border bg-card",
        "transition-[width] duration-200 ease-out [will-change:width]",
        collapsed ? "w-[64px]" : "w-[var(--es-sidebar-width)]",
      )}
    >
      <div className={cn(
        "flex shrink-0 items-center pb-4 pt-5",
        collapsed ? "justify-center px-2" : "justify-between gap-2 pl-3 pr-2",
      )}>
        {!collapsed && (
          <div className="flex min-w-0 items-center gap-2.5">
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
          </div>
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
            )}
          >
            <ToggleIcon className="size-4" />
          </button>
        )}
      </div>

      <nav
        className={cn(
          "flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden",
          "[scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:hover:bg-[var(--es-neutral-300)]",
          collapsed ? "px-2" : "px-3",
        )}
      >
        {items.map((item, i) => {
          if (isGroup(item)) {
            if (collapsed) {
              return <div key={`g-${i}`} className="mx-2 my-3 h-px bg-[var(--border-subtle)]" aria-hidden="true" />;
            }
            return (
              <div
                key={`g-${i}`}
                className="px-3 pb-1.5 pt-5 text-[10.5px] font-semibold uppercase tracking-[0.10em] text-muted-foreground/70"
              >
                {item.group}
              </div>
            );
          }
          const active = pathname.startsWith(item.href);
          const link = (
            <Link
              key={item.key}
              href={item.href}
              onClick={onNavClick}
              aria-label={collapsed ? item.label : undefined}
              className={cn(
                "relative flex items-center rounded-lg text-[13.5px] font-medium transition-[background-color,color] duration-150",
                collapsed ? "size-10 justify-center self-center" : "w-full gap-2.5 px-2.5 py-2",
                active
                  ? "bg-[var(--es-accent-50)] font-semibold text-[var(--es-accent-700)]"
                  : "text-[var(--es-neutral-600)] hover:bg-[var(--es-neutral-100)] hover:text-foreground",
              )}
            >
              <item.icon className={cn("size-[18px] shrink-0", active ? "text-[var(--es-accent-600)]" : "text-[var(--es-neutral-500)]")} />
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
          if (collapsed) {
            return (
              <Tooltip key={item.key}>
                <TooltipTrigger render={link} />
                <TooltipContent side="right" sideOffset={10}>{item.label}</TooltipContent>
              </Tooltip>
            );
          }
          return link;
        })}
      </nav>

      <div
        className={cn(
          "flex shrink-0 border-t border-[var(--border-subtle)] pb-5 pt-3",
          collapsed ? "flex-col items-center gap-2 px-2" : "items-stretch px-3",
        )}
      >
        <LocaleToggle
          variant={collapsed ? "compact" : "full"}
          className={collapsed ? undefined : "w-full"}
        />
      </div>
    </aside>
  );
}

