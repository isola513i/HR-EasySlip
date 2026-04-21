// ════════════════════════════════════════════════════════════════
// /employee/today — Stub landing for EMPLOYEE role
// Mobile-first PWA entry point (Day 3+)
// ════════════════════════════════════════════════════════════════

import { auth, signOut } from "@/lib/auth";

export const metadata = { title: "วันนี้ · EasySlip HR" };

export default async function EmployeeTodayPage() {
  const session = await auth();
  const emp = session?.user.employee;

  return (
    <main className="min-h-dvh px-5 py-8">
      <div className="mx-auto max-w-md space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">วันนี้</h1>
          <p className="text-muted-foreground text-sm">
            สวัสดี {emp?.firstNameTh} {emp?.lastNameTh} ({emp?.employeeCode})
          </p>
        </header>

        <div className="bg-card rounded-xl border p-6 text-sm shadow-sm">
          <p className="text-muted-foreground">
            ยังไม่ได้ลงเวลาเข้างาน (stub — จะ build จริง Day 3+)
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
