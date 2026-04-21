// ════════════════════════════════════════════════════════════════
// Root Route — Auth Gate + Role-Based Router
// ────────────────────────────────────────────────────────────────
// - Unauthenticated → redirect to /signin
// - Authenticated  → redirect to role-appropriate landing:
//     HRMG | HR_AUTHORIZED | CEO | CTO | COO  → /hr/overview
//     MANAGER                                 → /manager/inbox
//     EMPLOYEE (default)                      → /employee/today
// ════════════════════════════════════════════════════════════════

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

const HR_ROLES = ["HRMG", "HR_AUTHORIZED", "CEO", "CTO", "COO"] as const;

export default async function RootPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  const roles = session.user.employee?.roles ?? [];

  if (roles.some((r) => HR_ROLES.includes(r as (typeof HR_ROLES)[number]))) {
    redirect("/hr/overview");
  }
  if (roles.includes("MANAGER")) {
    redirect("/manager/inbox");
  }

  redirect("/employee/today");
}
