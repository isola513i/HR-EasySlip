// ════════════════════════════════════════════════════════════════
// /manager/inbox — Stub landing for MANAGER role
// ════════════════════════════════════════════════════════════════

import { auth, signOut } from "@/lib/auth";

export const metadata = { title: "Manager Inbox · EasySlip HR" };

export default async function ManagerInboxPage() {
  const session = await auth();
  const emp = session?.user.employee;

  return (
    <main className="min-h-dvh px-6 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Manager Inbox
          </h1>
          <p className="text-muted-foreground text-sm">
            สวัสดี {emp?.firstNameTh} {emp?.lastNameTh} ({emp?.employeeCode})
          </p>
        </header>

        <div className="bg-card rounded-xl border p-6 text-sm shadow-sm">
          <p className="text-muted-foreground">
            ยังไม่มีคำขอรออนุมัติ (stub page — จะ build จริง Day 3+)
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
            ออกจากระบบ
          </button>
        </form>
      </div>
    </main>
  );
}
