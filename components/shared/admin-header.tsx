"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Mail, Menu, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/shared/notification-bell";
import { UserMenu } from "@/components/shared/user-menu";
import { useT } from "@/lib/i18n/locale-context";

interface AdminHeaderProps {
  user: { name: string; role: string; initials: string };
  onMenuClick?: () => void;
  inboxHref?: string;
}

const SCROLL_THRESHOLD = 8;

export function AdminHeader({ user, onMenuClick, inboxHref = "/employee/inbox" }: AdminHeaderProps) {
  const t = useT();
  const [stuck, setStuck] = useState(false);
  const [query, setQuery] = useState("");
  const ticking = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        setStuck(window.scrollY > SCROLL_THRESHOLD);
        ticking.current = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-stuck={stuck ? "true" : "false"}
      className={cn(
        "safe-area-pt sticky top-0 z-30 flex h-[68px] shrink-0 items-center gap-3 px-4 lg:px-6",
        "transition-[background-color,border-color,box-shadow,backdrop-filter] duration-[var(--es-dur-base)] ease-[var(--es-ease-out)]",
        "border-b border-transparent bg-transparent",
        "data-[stuck=true]:border-border data-[stuck=true]:bg-card/85 data-[stuck=true]:shadow-[var(--es-shadow-sm)] data-[stuck=true]:supports-[backdrop-filter]:bg-card/70 data-[stuck=true]:supports-[backdrop-filter]:backdrop-blur-md",
      )}
    >
      {onMenuClick && (
        <button
          onClick={onMenuClick}
          className="-ml-1.5 grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted lg:hidden"
          aria-label={t.common.menu}
        >
          <Menu className="size-5" />
        </button>
      )}

      <label className="relative flex min-w-0 max-w-[560px] flex-1 items-center">
        <Search
          className="pointer-events-none absolute left-4 size-[18px] text-muted-foreground/70"
          aria-hidden="true"
          strokeWidth={1.75}
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.common.headerSearchPlaceholder}
          className={cn(
            "h-11 w-full rounded-full border border-border bg-card pl-11 pr-4 text-[13px] outline-none",
            "transition-[border-color,box-shadow,background-color] duration-[var(--es-dur-base)]",
            "placeholder:text-muted-foreground/70",
            "hover:border-[var(--es-neutral-300)]",
            "focus:border-[var(--es-accent-400)] focus:shadow-[0_0_0_4px_color-mix(in_oklch,var(--es-accent-500)_15%,transparent)]",
          )}
          aria-label={t.common.headerSearchPlaceholder}
        />
      </label>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Link
          href={inboxHref}
          aria-label={t.common.inbox}
          className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95 active:transition-transform active:duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <Mail className="size-[18px]" strokeWidth={1.75} />
        </Link>

        <NotificationBell />

        <span aria-hidden="true" className="mx-1 hidden h-7 w-px bg-border sm:block" />

        <UserMenu name={user.name} initials={user.initials} role={user.role} />
      </div>
    </header>
  );
}
