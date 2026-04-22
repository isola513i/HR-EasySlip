// ════════════════════════════════════════════════════════════════
// /employee/today — Stub landing for EMPLOYEE role
// Mobile-first PWA entry point (Day 3+)
// ════════════════════════════════════════════════════════════════

import type { Metadata } from "next";
import { signOut } from "@/lib/auth";
import { requireRoles, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getDictionary(locale);
  return { title: t.employee.todayTitle };
}

export default async function EmployeeTodayPage() {
  const user = await requireRoles(EMPLOYEE_ROLES);
  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <main className="min-h-dvh px-5 py-8">
      <div className="mx-auto max-w-md space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t.employee.todayTitle}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t.common.greeting} {user.firstNameTh} {user.lastNameTh} ({user.employeeCode})
          </p>
        </header>

        <div className="bg-card rounded-xl border p-6 text-sm shadow-sm">
          <p className="text-muted-foreground">
            {t.employee.notClockedIn}
          </p>
        </div>

        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/signin" });
          }}
        >
          <button
            type="submit"
            className="text-destructive text-sm underline underline-offset-4"
          >
            {t.common.signOut}
          </button>
        </form>
      </div>
    </main>
  );
}
