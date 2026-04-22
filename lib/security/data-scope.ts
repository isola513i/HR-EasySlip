// ════════════════════════════════════════════════════════════════
// Data Scope — Enforce data ownership at query level
// ────────────────────────────────────────────────────────────────
// Generates Prisma `where` clauses that restrict data visibility
// based on the caller's role:
//   EMPLOYEE   → own data only
//   MANAGER    → own + direct subordinates
//   HR / ADMIN → all employees (no filter)
// ════════════════════════════════════════════════════════════════

import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HR_ROLES } from "./rbac";

interface Caller {
  userId: string;
  employeeId: string | undefined;
  roles: Role[];
}

/**
 * Returns a Prisma `where` clause for employee-scoped queries.
 *
 * Usage:
 *   const scope = await employeeScope(caller);
 *   const records = await prisma.attendanceRecord.findMany({
 *     where: { ...scope, clockedAt: { gte: startDate } },
 *   });
 */
export async function employeeScope(
  caller: Caller,
): Promise<{ employeeId: string } | { employeeId: { in: string[] } }> {
  // HR roles see everything — return a filter that matches all
  if (caller.roles.some((r) => (HR_ROLES as readonly string[]).includes(r))) {
    // Return no restriction by fetching all employee IDs
    // For ~50 users this is fine; for larger orgs use a flag or skip filter
    const all = await prisma.employee.findMany({ select: { id: true } });
    return { employeeId: { in: all.map((e) => e.id) } };
  }

  if (!caller.employeeId) {
    // No employee record linked — return impossible filter (zero rows guaranteed)
    // "" could match rows with empty-string IDs; { in: [] } always returns nothing
    return { employeeId: { in: [] } };
  }

  // Manager: own + direct subordinates
  if (caller.roles.includes("MANAGER")) {
    const subordinates = await prisma.employee.findMany({
      where: { managerId: caller.employeeId },
      select: { id: true },
    });
    const ids = [caller.employeeId, ...subordinates.map((s) => s.id)];
    return { employeeId: { in: ids } };
  }

  // Employee: own data only
  return { employeeId: caller.employeeId };
}

/**
 * Check if caller can access a specific employee's data.
 *
 * Usage:
 *   if (!await canAccessEmployee(caller, targetEmployeeId)) {
 *     return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 *   }
 */
export async function canAccessEmployee(
  caller: Caller,
  targetEmployeeId: string,
): Promise<boolean> {
  // HR sees all
  if (caller.roles.some((r) => (HR_ROLES as readonly string[]).includes(r))) {
    return true;
  }

  if (!caller.employeeId) return false;

  // Own data
  if (caller.employeeId === targetEmployeeId) return true;

  // Manager → check if target is a direct subordinate
  if (caller.roles.includes("MANAGER")) {
    const subordinate = await prisma.employee.findFirst({
      where: { id: targetEmployeeId, managerId: caller.employeeId },
      select: { id: true },
    });
    return subordinate !== null;
  }

  return false;
}
