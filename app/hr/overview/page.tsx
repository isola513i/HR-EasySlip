// ════════════════════════════════════════════════════════════════
// /hr/overview — Stub landing for HR roles (Day 1 smoke test)
// Will be built out in Day 3+
// ════════════════════════════════════════════════════════════════

import { auth } from "@/lib/auth";
import { signOut } from "@/lib/auth";

export const metadata = { title: "HR Overview · EasySlip HR" };

export default async function HrOverviewPage() {
  const session = await auth();
  const emp = session?.user.employee;

  return (
    <main className="min-h-dvh px-6 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            HR Overview
          </h1>
          <p className="text-muted-foreground text-sm">
            สวัสดี {emp?.firstNameTh} {emp?.lastNameTh} ({emp?.employeeCode})
          </p>
        </header>

        <div className="bg-card rounded-xl border p-6 text-sm shadow-sm">
          <p className="mb-2 font-medium">Session debug</p>
          <pre className="bg-muted overflow-auto rounded p-3 text-xs">
            {JSON.stringify(
              {
                email: session?.user.email,
                employeeCode: emp?.employeeCode,
                roles: emp?.roles,
                status: emp?.employmentStatus,
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
            ออกจากระบบ
          </button>
        </form>
      </div>
    </main>
  );
}
