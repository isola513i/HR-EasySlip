import type { HrOvertimeRow } from "@/hooks/use-hr-overtime";
import { rowsToCSV } from "@/lib/export/csv-download";

export interface TopOTRow {
  employeeCode: string;
  name: string;
  hours: number;
}

export interface TrendPoint {
  monthKey: string;
  hours: number;
}

export function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function buildTopOT(rows: HrOvertimeRow[]): TopOTRow[] {
  const map = new Map<string, TopOTRow>();
  for (const r of rows) {
    if (r.status !== "APPROVED" || !r.hoursApproved) continue;
    const key = r.employee.employeeCode;
    const hours = Number(r.hoursApproved);
    const existing = map.get(key);
    if (existing) existing.hours += hours;
    else map.set(key, { employeeCode: key, name: `${r.employee.firstNameTh} ${r.employee.lastNameTh}`, hours });
  }
  return [...map.values()].sort((a, b) => b.hours - a.hours).slice(0, 5);
}

export function buildTrends(rows: HrOvertimeRow[]): TrendPoint[] {
  const sums = new Map<string, number>();
  const today = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    sums.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, 0);
  }
  for (const r of rows) {
    if (r.status !== "APPROVED" || !r.hoursApproved) continue;
    const k = monthKey(r.date);
    if (sums.has(k)) sums.set(k, sums.get(k)! + Number(r.hoursApproved));
  }
  return [...sums.entries()].map(([mk, hours]) => ({ monthKey: mk, hours }));
}

export function buildKpis(rows: HrOvertimeRow[]) {
  const today = new Date();
  const thisMonthKey = monthKey(today.toISOString());
  const lastMonthKey = monthKey(new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString());

  let monthHours = 0;
  let pendingCount = 0;
  let approvedCount = 0;
  let approvedThisMonth = 0;
  let approvedLastMonth = 0;
  const monthEmployees = new Set<string>();

  for (const r of rows) {
    const k = monthKey(r.date);
    const hours = r.hoursApproved ? Number(r.hoursApproved) : 0;

    if (k === thisMonthKey && hours > 0) {
      monthHours += hours;
      monthEmployees.add(r.employee.employeeCode);
    }
    if (r.status === "PENDING") pendingCount += 1;
    if (r.status === "APPROVED") {
      approvedCount += 1;
      if (k === thisMonthKey) approvedThisMonth += 1;
      if (k === lastMonthKey) approvedLastMonth += 1;
    }
  }

  const approvedDeltaPct =
    approvedLastMonth === 0
      ? null
      : ((approvedThisMonth - approvedLastMonth) / approvedLastMonth) * 100;

  const avg = monthEmployees.size === 0 ? 0 : monthHours / monthEmployees.size;
  return { monthHours, pendingCount, approvedCount, approvedDeltaPct, avg };
}

export function buildOvertimeCSV(rows: HrOvertimeRow[]): string {
  const header = ["EmployeeCode", "Name", "Date", "Type", "Hours", "Rate", "Status", "Reason"] as const;
  const data = rows.map((r) => [
    r.employee.employeeCode,
    `${r.employee.firstNameTh} ${r.employee.lastNameTh}`,
    r.date,
    r.overtimeType,
    r.hoursApproved ?? "",
    r.rateMultiplier,
    r.status,
    r.reason ?? "",
  ]);
  return rowsToCSV(header, data);
}
