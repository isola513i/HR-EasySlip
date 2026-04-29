"use client";

import { useState } from "react";
import { FileBarChart, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useT } from "@/lib/i18n/locale-context";

const REPORT_TYPES = [
  { value: "ATTENDANCE_SUMMARY", icon: "clock" },
  { value: "LEAVE_SUMMARY", icon: "calendar" },
  { value: "EMPLOYEE_DIRECTORY", icon: "users" },
  { value: "OT_SUMMARY", icon: "timer" },
] as const;

function getDefaultDates() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    dateFrom: from.toISOString().slice(0, 10),
    dateTo: now.toISOString().slice(0, 10),
  };
}

export function ReportBuilder() {
  const t = useT();
  const defaults = getDefaultDates();
  const [type, setType] = useState("ATTENDANCE_SUMMARY");
  const [format, setFormat] = useState("EXCEL");
  const [dateFrom, setDateFrom] = useState(defaults.dateFrom);
  const [dateTo, setDateTo] = useState(defaults.dateTo);
  const [isGenerating, setIsGenerating] = useState(false);

  const typeLabels: Record<string, string> = {
    ATTENDANCE_SUMMARY: t.hr.attendanceSummary,
    LEAVE_SUMMARY: t.hr.leaveSummary,
    EMPLOYEE_DIRECTORY: t.hr.employeeDirectoryReport,
    OT_SUMMARY: t.hr.otSummary,
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/v1/hr/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, format, dateFrom, dateTo }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const filename = disposition.match(/filename="(.+)"/)?.[1] ?? `report.${format === "EXCEL" ? "xlsx" : "csv"}`;

      const a = document.createElement("a");
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(t.hr.downloadSuccess);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.hr.downloadFailed);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Report type cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {REPORT_TYPES.map((rt) => (
          <button
            key={rt.value}
            onClick={() => setType(rt.value)}
            className={`flex flex-col items-center gap-2 rounded-xl border p-5 transition-colors ${
              type === rt.value
                ? "border-[var(--es-accent-400)] bg-[var(--es-accent-50)] shadow-sm"
                : "border-border bg-card hover:bg-muted"
            }`}
          >
            <FileBarChart className={`size-6 ${type === rt.value ? "text-[var(--es-accent-600)]" : "text-muted-foreground"}`} />
            <span className="text-xs font-medium text-center">{typeLabels[rt.value]}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-card p-5 shadow-[var(--es-shadow-sm)]">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>{t.hr.dateRange}</Label>
            <div className="flex gap-2">
              <DatePicker value={dateFrom} onChange={setDateFrom} max={dateTo || undefined} className="flex-1" />
              <DatePicker value={dateTo} onChange={setDateTo} min={dateFrom || undefined} className="flex-1" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t.hr.format}</Label>
            <Tabs value={format} onValueChange={setFormat}>
              <TabsList className="w-full">
                <TabsTrigger value="EXCEL" className="flex-1">Excel</TabsTrigger>
                <TabsTrigger value="CSV" className="flex-1">CSV</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full"
            >
              <Download className="mr-1.5 size-4" />
              {isGenerating ? t.hr.generating : t.hr.generateReport}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
