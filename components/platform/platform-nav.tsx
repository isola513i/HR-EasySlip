"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { key: "overview", label: "Overview", href: "/overview" },
  { key: "trials",   label: "Trials",   href: "/trials" },
  { key: "tenants",  label: "Tenants",  href: "/tenants" },
  { key: "plans",    label: "Plans",    href: "/plans" },
  { key: "team",     label: "Team",     href: "/team" },
  { key: "audit",    label: "Audit",    href: "/audit" },
] as const;

export type PlatformNavKey = (typeof NAV_ITEMS)[number]["key"];

export function PlatformNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden sm:flex items-center gap-0.5">
      {NAV_ITEMS.map(({ key, label, href }) => {
        const isActive = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={key}
            href={href}
            className={[
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150",
              isActive
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            ].join(" ")}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
