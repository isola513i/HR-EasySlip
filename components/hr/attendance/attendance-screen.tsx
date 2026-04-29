"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { KpiCards } from "@/components/hr/attendance/kpi-cards";
import { WeeklyOverviewChart } from "@/components/hr/attendance/weekly-overview-chart";
import { TodayAttendanceTable } from "@/components/hr/attendance/today-attendance-table";
import { useT } from "@/lib/i18n/locale-context";
import { todayISO } from "@/lib/format";

function getMondayOfWeek(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  const day = d.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function AttendanceScreen() {
  const t = useT();
  const today = todayISO();
  const [date, setDate] = useState(today);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/v1/hr/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ATTENDANCE_SUMMARY",
          format: "EXCEL",
          dateFrom: date,
          dateTo: date,
        }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-${date}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t.hr.downloadSuccess);
    } catch {
      toast.error(t.hr.downloadFailed);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.hr.attendance.title}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{t.hr.attendance.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <DatePicker value={date} onChange={setDate} max={today} />
          <Button onClick={handleExport} disabled={exporting} variant="outline">
            <Download className="mr-1.5 size-4" />
            {exporting ? t.hr.generating : t.hr.attendance.exportReport}
          </Button>
        </div>
      </div>

      <KpiCards date={date} />
      <WeeklyOverviewChart weekStart={getMondayOfWeek(date)} />
      <TodayAttendanceTable date={date} />
    </div>
  );
}
