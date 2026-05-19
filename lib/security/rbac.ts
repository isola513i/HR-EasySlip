// ════════════════════════════════════════════════════════════════
// RBAC Guard — Server-side role check for pages, actions & APIs
// ════════════════════════════════════════════════════════════════

import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { Role } from "@prisma/client";

/** Roles that can access HR-level features */
export const HR_ROLES: readonly Role[] = [
  "HRMG",
  "HR_AUTHORIZED",
  "CEO",
  "CTO",
  "COO",
  "ADMIN",
] as const;

/** Roles that can manage company settings and users (no salary access) */
export const TENANT_ADMIN_ROLES: readonly Role[] = [
  "TENANT_ADMIN",
  "HRMG",
  "CEO",
  "CTO",
  "COO",
] as const;

/** Roles that can access manager-level features */
export const MANAGER_ROLES: readonly Role[] = [
  "MANAGER",
  ...HR_ROLES,
] as const;

/** All roles — any authenticated employee */
export const EMPLOYEE_ROLES: readonly Role[] = [
  "EMPLOYEE",
  ...MANAGER_ROLES,
] as const;

/** Roles that can override payroll cut-off lock */
export const CUTOFF_OVERRIDE_ROLES: readonly Role[] = [
  "CEO",
  "CTO",
  "COO",
  "HRMG",
  "HR_AUTHORIZED",
] as const;

export { SENSITIVE_DATA_ROLES, isSensitiveDataRole } from "./role-helpers";

export interface AuthResult {
  userId: string;
  email: string | undefined;
  roles: Role[];
  employeeId: string | undefined;
  employeeCode: string | undefined;
  firstNameTh: string | undefined;
  lastNameTh: string | undefined;
}

/**
 * Require authentication and check that the user has at least one
 * of the specified roles. Redirects to /signin or shows 403 on failure.
 *
 * Usage in Server Components:
 *   const user = await requireRoles(["HRMG", "HR_AUTHORIZED"]);
 */
export async function requireRoles(
  allowedRoles: readonly Role[],
): Promise<AuthResult> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const emp = session.user.employee;
  const roles = (emp?.roles ?? []) as Role[];

  const hasRole = roles.some((r) => allowedRoles.includes(r));
  if (!hasRole) {
    redirect("/forbidden");
  }

  // Force password change before accessing any protected page
  if (session.user.mustChangePassword) {
    redirect("/change-password");
  }

  return {
    userId: session.user.id,
    email: session.user.email ?? undefined,
    roles,
    employeeId: emp?.id,
    employeeCode: emp?.employeeCode,
    firstNameTh: emp?.firstNameTh,
    lastNameTh: emp?.lastNameTh,
  };
}

/**
 * Check roles without redirecting — returns null if unauthorized.
 * Useful for conditional rendering or non-critical checks.
 */
export async function checkRoles(
  allowedRoles: readonly Role[],
): Promise<AuthResult | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const emp = session.user.employee;
  const roles = (emp?.roles ?? []) as Role[];

  if (!roles.some((r) => allowedRoles.includes(r))) return null;

  return {
    userId: session.user.id,
    email: session.user.email ?? undefined,
    roles,
    employeeId: emp?.id,
    employeeCode: emp?.employeeCode,
    firstNameTh: emp?.firstNameTh,
    lastNameTh: emp?.lastNameTh,
  };
}

/**
 * Guard for API Route Handlers (app/api/.../route.ts).
 * Returns JSON 401/403 on failure instead of HTML redirect.
 *
 * Usage:
 *   export async function GET() {
 *     const result = await requireApiRoles(HR_ROLES);
 *     if (result instanceof NextResponse) return result; // 401 or 403
 *     const { userId, roles } = result;
 *     // ... handle request
 *   }
 */
export async function requireApiRoles(
  allowedRoles: readonly Role[],
): Promise<AuthResult | NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Authentication required" },
      { status: 401 },
    );
  }

  const emp = session.user.employee;
  const roles = (emp?.roles ?? []) as Role[];

  if (!roles.some((r) => allowedRoles.includes(r))) {
    return NextResponse.json(
      { error: "Forbidden", message: "Insufficient permissions" },
      { status: 403 },
    );
  }

  return {
    userId: session.user.id,
    email: session.user.email ?? undefined,
    roles,
    employeeId: emp?.id,
    employeeCode: emp?.employeeCode,
    firstNameTh: emp?.firstNameTh,
    lastNameTh: emp?.lastNameTh,
  };
}

export type EmployeeAuthResult = AuthResult & { employeeId: string };

/**
 * Stricter guard: requires both valid roles AND an employee record.
 * Eliminates the need for manual `if (!caller.employeeId)` checks in routes.
 */
export async function requireApiEmployee(
  allowedRoles: readonly Role[],
): Promise<EmployeeAuthResult | NextResponse> {
  const result = await requireApiRoles(allowedRoles);
  if (result instanceof NextResponse) return result;
  if (!result.employeeId) {
    return NextResponse.json(
      { ok: false, error: "Forbidden", code: "NO_EMPLOYEE_RECORD" },
      { status: 403 },
    );
  }
  return result as EmployeeAuthResult;
}
