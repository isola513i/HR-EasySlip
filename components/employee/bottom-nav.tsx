"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Clock,
  CalendarDays,
  Inbox,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { hapticSelection } from "@/lib/haptics";
import { useT } from "@/lib/i18n/locale-context";
import { useEmployeeInboxUnread } from "@/hooks/use-employee-inbox-unread";
import { useMyPendingBadge } from "@/hooks/use-my-pending-badge";

export function BottomNav() {
  const pathname = usePathname();
  const t = useT();
  const nav = t.employee.bottomNav;
  const inboxUnread = useEmployeeInboxUnread();
  const hasPending = useMyPendingBadge();
  const items = [
    { href: "/employee/today", icon: Home, label: nav.home, badge: hasPending, badgeTone: "accent" as const },
    { href: "/employee/clock", icon: Clock, label: nav.clock, badge: false, badgeTone: "error" as const },
    { href: "/employee/leave", icon: CalendarDays, label: nav.leave, badge: false, badgeTone: "error" as const },
    { href: "/employee/inbox", icon: Inbox, label: nav.inbox, badge: inboxUnread, badgeTone: "error" as const },
    { href: "/employee/me", icon: User, label: nav.me, badge: false, badgeTone: "error" as const },
  ];

  return (
    <nav
      aria-label={nav.ariaLabel}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/85 backdrop-blur-[14px] safe-area-pb"
    >
      <div className="flex h-16 items-stretch px-1">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => { if (!active) hapticSelection(); }}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              className={cn(
                "group/nav relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors active:scale-[0.92] active:transition-transform active:duration-100",
                active
                  ? "text-[var(--es-accent-600)]"
                  : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "relative grid place-items-center rounded-full transition-[background-color,transform] duration-200",
                  active && "bg-[var(--es-accent-50)] px-3 py-1",
                )}
              >
                <item.icon className="size-[22px]" strokeWidth={active ? 2 : 1.75} />
                {item.badge && (
                  <span
                    aria-hidden="true"
                    className="absolute -right-0.5 -top-0.5 grid place-items-center"
                  >
                    <span className={`absolute inline-flex size-2.5 animate-ping rounded-full opacity-60 ${item.badgeTone === "accent" ? "bg-[var(--es-accent-500)]" : "bg-[var(--es-error-500)]"}`} />
                    <span className={`relative inline-flex size-1.5 rounded-full ${item.badgeTone === "accent" ? "bg-[var(--es-accent-500)]" : "bg-[var(--es-error-500)]"}`} />
                  </span>
                )}
              </span>
              <span>{item.label}</span>
              {active && (
                <span
                  aria-hidden="true"
                  className="animate-in zoom-in fade-in duration-200 absolute -top-0.5 h-0.5 w-8 rounded-full bg-[var(--es-accent-600)]"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
