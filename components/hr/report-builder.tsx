"use client";

import { useEffect, useState } from "react";
import { FileBarChart, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch } from "@/lib/api/client";
import { downloadBlob } from "@/lib/download";
import { useT } from "@/lib/i18n/locale-context";
import { ReportPreview } from "@/components/hr/report-preview";

interface Department { id: string; name: string; code: string }
const ALL_DEPARTMENTS = "__ALL__";

const REPORT_TYPES = [
  { value: "ATTENDANCE_SUMMARY" },
  { value: "LEAVE_SUMMARY" },
  { value: "EMPLOYEE_DIRECTORY" },
  { value: "OT_SUMMARY" },
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
  const [departmentId, setDepartmentId] = useState<string>(ALL_DEPARTMENTS);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    apiFetch<Department[]>("/api/v1/hr/departments").then(setDepartments).catch(() => {});
  }, []);

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
        body: JSON.stringify({
          type,
          format,
          dateFrom,
          dateTo,
          ...(departmentId !== ALL_DEPARTMENTS ? { departmentId } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed");
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const filename = disposition.match(/filename="(.+)"/)?.[1] ?? `report.${format === "EXCEL" ? "xlsx" : "csv"}`;
      downloadBlob(blob, filename);
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
                ? "border-(--es-accent-400) bg-(--es-accent-50) shadow-sm"
                : "border-border bg-card hover:bg-muted"
            }`}
          >
            <FileBarChart className={`size-6 ${type === rt.value ? "text-(--es-accent-600)" : "text-muted-foreground"}`} />
            <span className="text-xs font-medium text-center">{typeLabels[rt.value]}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-card p-5 shadow-(--es-shadow-sm)">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium leading-none">{t.hr.dateRange}</legend>
            <div className="flex gap-2">
              <DatePicker value={dateFrom} onChange={setDateFrom} max={dateTo || undefined} className="flex-1" />
              <DatePicker value={dateTo} onChange={setDateTo} min={dateFrom || undefined} className="flex-1" />
            </div>
          </fieldset>
          <div className="space-y-1.5">
            <Label>{t.hr.department}</Label>
            <Select value={departmentId} onValueChange={(v) => { if (v) setDepartmentId(v); }}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {departmentId === ALL_DEPARTMENTS
                    ? t.hr.employees.allDepartments
                    : (departments.find((d) => d.id === departmentId)?.name ?? "—")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_DEPARTMENTS}>{t.hr.employees.allDepartments}</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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

      <ReportPreview
        type={type}
        dateFrom={dateFrom}
        dateTo={dateTo}
        departmentId={departmentId === ALL_DEPARTMENTS ? undefined : departmentId}
      />
    </div>
  );
}
