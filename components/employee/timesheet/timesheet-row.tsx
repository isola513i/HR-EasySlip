"use client";

import { MapPin, Home, Building2, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFormat } from "@/hooks/use-format";
import { formatHM } from "@/lib/format";
import type { TimesheetEntry } from "@/hooks/use-timesheet";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type TsT = Dictionary["timesheet"];

function LocationIcon({ loc }: { loc: TimesheetEntry["workLocation"] }) {
  if (loc === "WFH") return <Home className="size-3.5" aria-hidden />;
  if (loc === "ON_SITE") return <MapPin className="size-3.5" aria-hidden />;
  return <Building2 className="size-3.5" aria-hidden />;
}

interface TimesheetRowProps {
  entry: TimesheetEntry;
  isFirst: boolean;
  fmt: ReturnType<typeof useFormat>;
  t: TsT;
  onRequestCorrection: () => void;
}

export function TimesheetRow({ entry, isFirst, fmt, t, onRequestCorrection }: TimesheetRowProps) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${isFirst ? "" : "border-t border-border"}`}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold">{fmt.formatDate(entry.date)}</span>
          {entry.workLocation && (
            <Badge variant="outline" className="h-5 gap-1 text-[10px]">
              <LocationIcon loc={entry.workLocation} />
              {(t.locations as Record<string, string>)[entry.workLocation] ?? entry.workLocation}
            </Badge>
          )}
          {entry.hasBackfill && <Badge variant="outline" className="h-5 text-[10px]">{t.backfilled}</Badge>}
        </div>
        <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground tabular-nums">
          <span>{t.firstIn}: {entry.firstIn ? fmt.formatTime(entry.firstIn) : "—"}</span>
          <span>{t.lastOut}: {entry.lastOut ? fmt.formatTime(entry.lastOut) : "—"}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right">
          <div className="text-[13px] font-semibold tabular-nums">
            {formatHM(entry.workedMinutes, t.hoursAbbr, t.minutesAbbr)}
          </div>
          {entry.lateMinutes > 0 && (
            <div className="text-[10px] font-medium text-[var(--es-warn-600)] tabular-nums">
              {t.late} {formatHM(entry.lateMinutes, t.hoursAbbr, t.minutesAbbr)}
            </div>
          )}
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-7"
          onClick={onRequestCorrection}
          aria-label={t.requestCorrection}
          title={t.requestCorrection}
        >
          <Pencil className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
