"use client";

import { Building2, Users, CreditCard, ShieldCheck, Database } from "lucide-react";
import { AdminShell } from "@/components/shared/admin-shell";
import type { NavItem } from "@/components/shared/admin-sidebar";
import { useT } from "@/lib/i18n/locale-context";

interface Props {
  user: { id: string; name: string; role: string };
  children: React.ReactNode;
}

export function SettingsShell({ user, children }: Props) {
  const t = useT();
  const nav = t.tenantSettings.nav;

  const navItems: NavItem[] = [
    { key: "company", href: "/settings/company", icon: Building2, label: nav.company },
    { key: "users", href: "/settings/users", icon: Users, label: nav.users },
    { key: "billing", href: "/settings/billing", icon: CreditCard, label: nav.billing },
    { key: "security", href: "/settings/security", icon: ShieldCheck, label: nav.security },
    { key: "data", href: "/settings/data", icon: Database, label: nav.data },
  ];

  return (
    <AdminShell navItems={navItems} defaultTitle={nav.defaultTitle} user={user}>
      {children}
    </AdminShell>
  );
}
