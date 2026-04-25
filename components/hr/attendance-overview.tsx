"use client";

import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  useAttendanceTeam,
  type AttendanceRecord,
} from "@/hooks/use-attendance-team";
import { formatTime, calcDuration } from "@/lib/format";

type EmployeeRow = {
  employee: AttendanceRecord["employee"];
  clockIn: AttendanceRecord | null;
  clockOut: AttendanceRecord | null;
};

function groupRecords(records: AttendanceRecord[]): EmployeeRow[] {
  const map = new Map<string, { employee: AttendanceRecord["employee"]; ins: AttendanceRecord[]; outs: AttendanceRecord[] }>();
  for (const r of records) {
    const key = r.employee.id;
    if (!map.has(key)) map.set(key, { employee: r.employee, ins: [], outs: [] });
    const bucket = map.get(key)!;
    if (r.clockType === "IN") bucket.ins.push(r);
    else bucket.outs.push(r);
  }
  return Array.from(map.values())
    .map(({ employee, ins, outs }) => ({
      employee,
      clockIn: ins[0] ?? null,
      clockOut: outs[0] ?? null,
    }))
    .sort((a, b) => a.employee.employeeCode.localeCompare(b.employee.employeeCode));
}

const LOCATION_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  OFFICE: "default",
  WFH: "secondary",
  ON_SITE: "outline",
};

export function AttendanceOverview() {
  const { records, isLoading, error, date, setDate } = useAttendanceTeam();
  const rows = groupRecords(records);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium" htmlFor="att-date">Date</label>
        <input
          id="att-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-md border bg-background px-3 py-1.5 text-sm"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="py-16 text-center text-[var(--es-error-500)]">{error}</div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <Clock className="size-10 opacity-40" />
          <p className="text-sm">ไม่มีข้อมูลการลงเวลาวันนี้</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="w-[80px]">Clock In</TableHead>
                <TableHead className="w-[80px]">Clock Out</TableHead>
                <TableHead className="w-[80px]">Duration</TableHead>
                <TableHead className="w-[100px]">Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ employee, clockIn, clockOut }) => (
                <TableRow key={employee.id}>
                  <TableCell className="tabular-nums font-medium">
                    {employee.employeeCode}
                  </TableCell>
                  <TableCell>
                    {employee.firstNameTh} {employee.lastNameTh}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {clockIn ? formatTime(clockIn.clockedAt) : "—"}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {clockOut ? formatTime(clockOut.clockedAt) : "—"}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {clockIn && clockOut
                      ? calcDuration(clockIn.clockedAt, clockOut.clockedAt)
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {clockIn ? (
                      <Badge variant={LOCATION_VARIANT[clockIn.workLocation] ?? "outline"}>
                        {clockIn.workLocation}
                      </Badge>
                    ) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
