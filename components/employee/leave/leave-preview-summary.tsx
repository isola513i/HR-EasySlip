"use client";

import { InfoBanner } from "@/components/shared/info-banner";
import { useT } from "@/lib/i18n/locale-context";

interface OverlapInfo {
  leaveType: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface LeavePreviewSummaryProps {
  preview: {
    days: number;
    sufficient: boolean;
    overlap?: OverlapInfo | null;
  } | null;
  startDate: string;
  endDate: string;
}

export function LeavePreviewSummary({ preview, startDate, endDate }: LeavePreviewSummaryProps) {
  const t = useT();
  if (!preview) return null;

  const overlapMsg = preview.overlap
    ? t.leave.overlapWarning
        .replace(
          "{leaveType}",
          (t.leave as Record<string, string>)[preview.overlap.leaveType.toLowerCase()] ??
            preview.overlap.leaveType,
        )
        .replace("{startDate}", preview.overlap.startDate)
        .replace("{endDate}", preview.overlap.endDate)
        .replace(
          "{status}",
          (t.myLeaveCalendar.statusLabel as Record<string, string>)[preview.overlap.status] ??
            preview.overlap.status,
        )
    : null;

  return (
    <div className="space-y-3">
      <InfoBanner tone={preview.sufficient ? "accent" : "error"}>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">{t.leave.daySummary}</div>
            <div className="tabular-nums opacity-80">
              {startDate} – {endDate} · {t.leave.excludeHolidays}
            </div>
          </div>
          <div className="tabular-nums text-2xl font-bold">
            {preview.days}
            <span className="text-xs opacity-70"> {t.common.days}</span>
          </div>
        </div>
      </InfoBanner>

      {overlapMsg && <InfoBanner tone="error">{overlapMsg}</InfoBanner>}
    </div>
  );
}
