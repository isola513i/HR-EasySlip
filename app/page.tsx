// ════════════════════════════════════════════════════════════════
// Root Route — Auth Gate + Role-Based Router
// ────────────────────────────────────────────────────────────────
// - Unauthenticated → redirect to /signin
// - Authenticated  → redirect to role-appropriate landing:
//     HRMG | HR_AUTHORIZED | CEO | CTO | COO  → /hr/overview
//     MANAGER | EMPLOYEE (default)             → /employee/today
// ════════════════════════════════════════════════════════════════

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { HR_ROLES } from "@/lib/security/rbac";
import type { Role } from "@prisma/client";

export default async function RootPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  // Force password change before accessing the app
  if (session.user.mustChangePassword) {
    redirect("/change-password");
  }

  const roles = (session.user.employee?.roles ?? []) as Role[];

  if (roles.some((r) => (HR_ROLES as readonly string[]).includes(r))) {
    redirect("/hr/overview");
  }

  redirect("/employee/today");
}
