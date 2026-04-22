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

const items = [
  { href: "/employee/today", icon: Home, label: "Home" },
  { href: "/employee/clock", icon: Clock, label: "Clock" },
  { href: "/employee/leave", icon: CalendarDays, label: "Leave" },
  { href: "/employee/inbox", icon: Inbox, label: "Inbox" },
  { href: "/employee/me", icon: User, label: "Me" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/85 backdrop-blur-[14px] safe-area-pb">
      <div className="flex h-16 items-stretch px-1">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors",
                active
                  ? "text-[var(--es-accent-600)]"
                  : "text-muted-foreground",
              )}
            >
              <item.icon className="size-[22px]" strokeWidth={1.75} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
