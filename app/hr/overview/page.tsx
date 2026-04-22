// ════════════════════════════════════════════════════════════════
// /hr/overview — Stub landing for HR roles (Day 1 smoke test)
// Will be built out in Day 3+
// ════════════════════════════════════════════════════════════════

import type { Metadata } from "next";
import { signOut } from "@/lib/auth";
import { requireRoles, HR_ROLES } from "@/lib/security/rbac";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getDictionary(locale);
  return { title: t.hr.overviewTitle };
}

export default async function HrOverviewPage() {
  const user = await requireRoles(HR_ROLES);
  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <main className="min-h-dvh px-6 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t.hr.overviewTitle}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t.common.greeting} {user.firstNameTh} {user.lastNameTh} ({user.employeeCode})
          </p>
        </header>

        <div className="bg-card rounded-xl border p-6 text-sm shadow-sm">
          <p className="mb-2 font-medium">{t.common.sessionDebug}</p>
          <pre className="bg-muted overflow-auto rounded p-3 text-xs">
            {JSON.stringify(
              {
                userId: user.userId,
                employeeCode: user.employeeCode,
                roles: user.roles,
              },
              null,
              2,
            )}
          </pre>
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
