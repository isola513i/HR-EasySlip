"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Clock,
  CalendarDays,
  CheckSquare,
  Inbox,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { hapticSelection } from "@/lib/haptics";
import { useT } from "@/lib/i18n/locale-context";
import { useEmployeeInboxUnread } from "@/hooks/use-employee-inbox-unread";
import { useMyPendingBadge } from "@/hooks/use-my-pending-badge";
import { useApprovalCounts } from "@/contexts/approval-counts-provider";

type BadgeTone = "accent" | "error";

interface BottomNavProps {
  isManager?: boolean;
}

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  badge: boolean;
  badgeTone: BadgeTone;
}

function ApprovalsTab({ active }: { active: boolean }) {
  const { count, isLoading } = useApprovalCounts();
  const hasBadge = !isLoading && count > 0;
  return (
    <span
      className={cn(
        "relative grid place-items-center rounded-full transition-[background-color,transform] duration-200",
        active && "bg-[var(--es-accent-50)] px-3 py-1",
      )}
    >
      <CheckSquare className="size-[22px]" strokeWidth={active ? 2 : 1.75} />
      {hasBadge && (
        <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 grid place-items-center">
          <span className="absolute inline-flex size-2.5 animate-ping rounded-full bg-[var(--es-error-500)] opacity-60" />
          <span className="relative inline-flex size-1.5 rounded-full bg-[var(--es-error-500)]" />
        </span>
      )}
    </span>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      onClick={() => { if (!active) hapticSelection(); }}
      aria-current={active ? "page" : undefined}
      aria-label={item.label}
      className={cn(
        "group/nav relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors active:scale-[0.92] active:transition-transform active:duration-100",
        active ? "text-[var(--es-accent-600)]" : "text-muted-foreground",
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
          <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 grid place-items-center">
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
}

export function BottomNav({ isManager = false }: BottomNavProps) {
  const pathname = usePathname();
  const t = useT();
  const nav = t.employee.bottomNav;
  const inboxUnread = useEmployeeInboxUnread();
  const hasPending = useMyPendingBadge();

  const baseItems: NavItem[] = [
    { href: "/employee/today", icon: Home, label: nav.home, badge: hasPending, badgeTone: "accent" },
    { href: "/employee/clock", icon: Clock, label: nav.clock, badge: false, badgeTone: "error" },
    { href: "/employee/leave", icon: CalendarDays, label: nav.leave, badge: false, badgeTone: "error" },
  ];

  const tailItems: NavItem[] = [
    { href: "/employee/inbox", icon: Inbox, label: nav.inbox, badge: inboxUnread, badgeTone: "error" },
    { href: "/employee/me", icon: User, label: nav.me, badge: false, badgeTone: "error" },
  ];

  const approvalsActive = pathname.startsWith("/employee/approvals");

  return (
    <nav
      aria-label={nav.ariaLabel}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/85 backdrop-blur-[14px] safe-area-pb"
    >
      <div className="flex h-16 items-stretch px-1">
        {baseItems.map((item) => (
          <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} />
        ))}

        {isManager && (
          <Link
            href="/employee/approvals"
            onClick={() => { if (!approvalsActive) hapticSelection(); }}
            aria-current={approvalsActive ? "page" : undefined}
            aria-label={nav.approvals}
            className={cn(
              "group/nav relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors active:scale-[0.92] active:transition-transform active:duration-100",
              approvalsActive ? "text-[var(--es-accent-600)]" : "text-muted-foreground",
            )}
          >
            <ApprovalsTab active={approvalsActive} />
            <span>{nav.approvals}</span>
            {approvalsActive && (
              <span
                aria-hidden="true"
                className="animate-in zoom-in fade-in duration-200 absolute -top-0.5 h-0.5 w-8 rounded-full bg-[var(--es-accent-600)]"
              />
            )}
          </Link>
        )}

        {tailItems.map((item) => (
          <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} />
        ))}
      </div>
    </nav>
  );
}
