/**
 * Data masking utilities applied during impersonation sessions.
 * Salary and other sensitive fields are replaced with null.
 */

type WithSalary = { baseSalary?: unknown };

/** Mask baseSalary to null in a single employee-like object */
export function maskEmployeeForImpersonation<T extends WithSalary>(employee: T): T {
  if (!("baseSalary" in employee)) return employee;
  return { ...employee, baseSalary: null };
}

/** Mask baseSalary in an array of employee-like objects */
export function maskEmployeeList<T extends WithSalary>(list: T[]): T[] {
  return list.map(maskEmployeeForImpersonation);
}

/** Mask sensitive before/after fields in an audit log row */
export function maskAuditRow<T extends { before?: unknown; after?: unknown; entityType?: string }>(
  row: T,
): T {
  const sensitiveTypes = new Set(["User", "Employee", "SalaryAdjustment"]);
  if (!row.entityType || !sensitiveTypes.has(row.entityType)) return row;

  function scrub(obj: unknown): unknown {
    if (!obj || typeof obj !== "object") return obj;
    const o = obj as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(o)) {
      if (k === "baseSalary" || k === "passwordHash" || k === "password") {
        result[k] = "[redacted]";
      } else {
        result[k] = v;
      }
    }
    return result;
  }

  return { ...row, before: scrub(row.before), after: scrub(row.after) };
}
