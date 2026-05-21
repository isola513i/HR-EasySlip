import { requirePlatformSession } from "@/lib/auth/platform";
import { PLATFORM_ADMIN_ROLES } from "@/lib/security/platform-rbac";
import { NewTenantForm } from "./new-tenant-form";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const metadata = { title: "Provision tenant — EasySlip Platform" };

export default async function NewTenantPage() {
  await requirePlatformSession(PLATFORM_ADMIN_ROLES);

  return (
    <div className="space-y-10">
      <div className="space-y-5">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <Link
            href="/platform/tenants"
            className="hover:text-foreground transition-colors"
          >
            Tenants
          </Link>
          <ChevronRight className="size-3.5 opacity-60" aria-hidden />
          <span className="text-foreground">New</span>
        </nav>
        <div className="max-w-2xl space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Provision a new tenant
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Creates a workspace and runs the initial database migration. Bypasses
            the trial signup queue. Use for verified customers, internal pilots,
            or onboarding outside the public flow.
          </p>
        </div>
      </div>

      <NewTenantForm />
    </div>
  );
}
