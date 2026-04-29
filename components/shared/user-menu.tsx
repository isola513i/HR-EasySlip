"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useT } from "@/lib/i18n/locale-context";

interface Props {
  name: string;
  initials: string;
  role: string;
}

export function UserMenu({ name, initials, role }: Props) {
  const t = useT();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={name}
        className="group/user flex shrink-0 cursor-pointer items-center gap-2.5 rounded-full pl-1 pr-3 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 data-popup-open:bg-muted/60"
      >
        <span className="es-brand-gradient grid size-9 shrink-0 place-items-center rounded-full text-[12px] font-semibold text-white ring-2 ring-card transition-shadow group-hover/user:shadow-[var(--es-shadow-sm)]">
          {initials.toUpperCase()}
        </span>
        <span className="hidden text-[13px] font-medium leading-tight text-foreground sm:block">
          {name}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="min-w-[220px] p-1">
        <DropdownMenuLabel className="px-2 py-1.5">
          <div className="truncate text-[13px] font-semibold leading-tight">{name}</div>
          <div className="truncate text-[11px] font-normal text-muted-foreground">{role}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
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
  );
}
