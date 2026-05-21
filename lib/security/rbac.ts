// ════════════════════════════════════════════════════════════════
// RBAC Guard — Server-side role check for pages, actions & APIs
// ════════════════════════════════════════════════════════════════

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTenantPrisma } from "@/lib/db/tenant";
import { BLOCKED_EMPLOYMENT_STATUSES } from "@/lib/auth/password-utils";
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

/** Roles that redirect to /hr/overview (vs /employee/today) in workspace picker */
export const HR_LANDING_ROLES = new Set<string>([
  "TENANT_ADMIN",
  "HR_AUTHORIZED",
  "HRMG",
  "CEO",
  "CTO",
  "COO",
  "ADMIN",
]);

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

async function resolveEmployee(tenantId: string, employeeRecordId: string) {
  const tp = await getTenantPrisma(tenantId);
  return tp.employee.findUnique({
    where: { id: employeeRecordId },
    select: {
      id: true,
      employeeCode: true,
      roles: true,
      firstNameTh: true,
      lastNameTh: true,
      employmentStatus: true,
    },
  });
}

/**
 * Require authentication and role. Redirects on failure.
 * Reads tenant context from middleware-injected headers.
 */
export async function requireRoles(
  allowedRoles: readonly Role[],
): Promise<AuthResult> {
  const [session, h] = await Promise.all([auth(), headers()]);
  const tenantId = h.get("x-tenant-id") ?? "";
  const tenantSlug = h.get("x-tenant-slug") ?? "";

  if (!session?.user?.id) {
    redirect(tenantSlug ? `/${tenantSlug}/signin` : "/workspaces");
  }

  const membership = session.user.memberships?.find(
    (m) => m.tenantId === tenantId,
  );
  if (!membership || membership.status !== "ACTIVE") {
    redirect("/workspaces?error=no_access");
  }

  if (session.user.mustChangePassword) {
    redirect(`/${tenantSlug}/change-password`);
  }

  if (!membership.employeeRecordId) {
    redirect(`/${tenantSlug}/forbidden`);
  }

  const emp = await resolveEmployee(tenantId, membership.employeeRecordId);
  if (!emp) redirect(`/${tenantSlug}/forbidden`);

  if (
    BLOCKED_EMPLOYMENT_STATUSES.includes(
      emp.employmentStatus as (typeof BLOCKED_EMPLOYMENT_STATUSES)[number],
    )
  ) {
    redirect(`/${tenantSlug}/forbidden?reason=suspended`);
  }

  const roles = emp.roles as Role[];
  if (!roles.some((r) => allowedRoles.includes(r))) {
    redirect(`/${tenantSlug}/forbidden`);
  }

  return {
    userId: session.user.id,
    email: session.user.email ?? undefined,
    roles,
    employeeId: emp.id,
    employeeCode: emp.employeeCode,
    firstNameTh: emp.firstNameTh,
    lastNameTh: emp.lastNameTh,
  };
}

/**
 * Check roles without redirecting — returns null if unauthorized.
 */
export async function checkRoles(
  allowedRoles: readonly Role[],
): Promise<AuthResult | null> {
  const [session, h] = await Promise.all([auth(), headers()]);
  if (!session?.user?.id) return null;

  const tenantId = h.get("x-tenant-id") ?? "";
  const membership = session.user.memberships?.find(
    (m) => m.tenantId === tenantId,
  );
  if (!membership || membership.status !== "ACTIVE") return null;
  if (!membership.employeeRecordId) return null;

  const emp = await resolveEmployee(tenantId, membership.employeeRecordId);
  if (!emp) return null;

  const roles = emp.roles as Role[];
  if (!roles.some((r) => allowedRoles.includes(r))) return null;

  return {
    userId: session.user.id,
    email: session.user.email ?? undefined,
    roles,
    employeeId: emp.id,
    employeeCode: emp.employeeCode,
    firstNameTh: emp.firstNameTh,
    lastNameTh: emp.lastNameTh,
  };
}

/**
 * Guard for API Route Handlers. Returns JSON 401/403 on failure.
 */
export async function requireApiRoles(
  allowedRoles: readonly Role[],
): Promise<AuthResult | NextResponse> {
  const [session, h] = await Promise.all([auth(), headers()]);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Authentication required" },
      { status: 401 },
    );
  }

  const tenantId = h.get("x-tenant-id") ?? "";
  const membership = session.user.memberships?.find(
    (m) => m.tenantId === tenantId,
  );
  if (!membership || membership.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "Forbidden", message: "No active membership in this workspace" },
      { status: 403 },
    );
  }

  if (!membership.employeeRecordId) {
    return NextResponse.json(
      { error: "Forbidden", message: "No employee record" },
      { status: 403 },
    );
  }

  const emp = await resolveEmployee(tenantId, membership.employeeRecordId);
  if (!emp) {
    return NextResponse.json(
      { error: "Forbidden", message: "Employee record not found" },
      { status: 403 },
    );
  }

  const roles = emp.roles as Role[];
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
    employeeId: emp.id,
    employeeCode: emp.employeeCode,
    firstNameTh: emp.firstNameTh,
    lastNameTh: emp.lastNameTh,
  };
}

export type EmployeeAuthResult = AuthResult & { employeeId: string };

/**
 * Stricter guard: requires both valid roles AND an employee record.
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
