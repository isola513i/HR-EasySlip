"use client";

import Link from "next/link";
import { Building2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { HR_LANDING_ROLES } from "@/lib/security/role-helpers";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

interface Membership {
  tenantId: string;
  tenantSlug: string;
  role: string;
  employeeRecordId: string;
  status: string;
}

interface Props {
  memberships: Membership[];
  error?: string;
  t: Dictionary;
}

export function WorkspacePicker({ memberships, error, t }: Props) {
  const tw = t.workspaces;

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div
            className="size-12 rounded-2xl flex items-center justify-center shadow-sm"
            style={{ background: "linear-gradient(135deg, #3d46cc, #06b6d4)" }}
            aria-hidden
          >
            <span className="text-white text-lg font-bold tracking-tight">ES</span>
          </div>
          <h1 className="text-xl font-semibold">{tw.heading}</h1>
          <p className="text-sm text-muted-foreground">{tw.subtitle}</p>
        </div>

        {error === "no_access" && (
          <p className="text-center text-sm text-destructive">{tw.noAccess}</p>
        )}

        <div className="space-y-2">
          {memberships.map((m) => {
            const landingPath = HR_LANDING_ROLES.has(m.role) ? "dashboard" : "employee/today";
            return (
              <Link
                key={m.tenantId}
                href={`/${m.tenantSlug}/${landingPath}`}
                className={buttonVariants({
                  variant: "outline",
                  className: "w-full h-auto py-3 px-4 justify-start gap-3",
                })}
              >
                <Building2 className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm">{m.tenantSlug}</p>
                  <p className="text-xs text-muted-foreground capitalize">{m.role.toLowerCase().replace(/_/g, " ")}</p>
                </div>
                <span className="text-xs text-muted-foreground">{tw.open} →</span>
              </Link>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground/50">
          EasySlip HR · Powered by EasySlip
        </p>
      </div>
    </div>
  );
}
