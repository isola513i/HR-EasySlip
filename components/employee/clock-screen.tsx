"use client";

import { useEffect, useId, useRef } from "react";
import Link from "next/link";
import { Clock, MapPin, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { StatusPill } from "@/components/shared/status-pill";
import { MobileTopbar } from "@/components/shared/mobile-topbar";
import { SectionLabel } from "@/components/shared/section-label";
import { PillToggleGroup } from "@/components/shared/pill-toggle-group";
import { cn } from "@/lib/utils";
import { useClock, type LocationType } from "@/hooks/use-clock";
import { useAttendancePolicy } from "@/hooks/use-attendance-policy";
import { useT } from "@/lib/i18n/locale-context";
import { hapticError, hapticSuccess, hapticTap } from "@/lib/haptics";

export function ClockScreen() {
  const t = useT();

  const locations = [
    { key: "OFFICE" as LocationType, label: t.clock.office },
    { key: "WFH" as LocationType, label: t.clock.wfh },
    { key: "ON_SITE" as LocationType, label: t.clock.onSite },
  ];
  const {
    clockState, clockType, location, setLocation,
    coords, gpsStatus, clockedTime, error, geofenceWarning, queuedOffline, handleClock, reset,
  } = useClock();
  const { policy } = useAttendancePolicy();
  const disclaimer = policy.enforceGeofence ? t.clock.gpsDisclaimerEnforced : t.clock.gpsDisclaimer;
  const dotGridId = useId();

  useEffect(() => { if (error) { toast.error(error); hapticError(); } }, [error]);

  useEffect(() => {
    if (!geofenceWarning) return;
    toast.warning(
      t.clock.geofenceWarning
        .replace("{distance}", String(geofenceWarning.distanceMeters))
        .replace("{radius}", String(geofenceWarning.radiusMeters)),
      { duration: 7000 },
    );
    // Toast once per warning flip — locale-switch would otherwise re-toast.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geofenceWarning]);

  useEffect(() => {
    if (queuedOffline) toast.info(t.clock.offlineQueued, { duration: 6000 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queuedOffline]);

  const lastClockState = useRef(clockState);
  useEffect(() => {
    if (lastClockState.current !== "done" && clockState === "done") hapticSuccess();
    lastClockState.current = clockState;
  }, [clockState]);

  const locationLabel =
    location === "OFFICE" ? t.clock.office : location === "WFH" ? t.clock.wfh : t.clock.onSite;

  return (
    <>
      <MobileTopbar title={t.clock.title} />

      <div className="flex flex-col gap-4 p-4">
<div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--es-shadow-sm)]">
          <div className="relative grid h-[140px] place-items-center overflow-hidden border-b border-border bg-gradient-to-br from-[var(--es-neutral-50)] to-[var(--es-neutral-100)]">
            {/* dot-grid background */}
            <svg className="absolute inset-0 opacity-30" width="100%" height="100%">
              <defs>
                <pattern id={dotGridId} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="10" cy="10" r="0.8" fill="var(--es-neutral-400)" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill={`url(#${dotGridId})`} />
            </svg>
            {gpsStatus === "loading" && (
              <div className="relative flex items-center justify-center">
                <span className="absolute inline-flex size-16 animate-ping rounded-full bg-[var(--es-accent-400)] opacity-20" style={{ animationDuration: "2s" }} />
                <span className="absolute inline-flex size-10 animate-ping rounded-full bg-[var(--es-accent-400)] opacity-30" style={{ animationDuration: "2s", animationDelay: "0.5s" }} />
                <div className="relative grid size-9 place-items-center rounded-full bg-[var(--es-neutral-300)]">
                  <MapPin className="size-[18px] text-[var(--es-neutral-500)]" />
                </div>
              </div>
            )}
            {gpsStatus === "ready" && coords && (
              <div className="relative flex items-center justify-center">
                <span className="absolute size-[72px] rounded-full border-2 border-[var(--es-accent-400)] bg-[var(--es-accent-400)] opacity-10" />
                <span className="absolute size-[72px] rounded-full border-2 border-[var(--es-accent-400)] opacity-30" />
                <div className="relative grid size-9 place-items-center rounded-full bg-[var(--es-accent-600)] shadow-[0_0_0_6px_rgba(61,70,204,0.15)]">
                  <MapPin className="size-[18px] text-white" />
                </div>
              </div>
            )}
            {(gpsStatus === "denied" || (gpsStatus === "ready" && !coords)) && (
              <div className="relative grid size-9 place-items-center rounded-full bg-[var(--es-warn-100)] shadow-[0_0_0_6px_rgba(234,179,8,0.12)]">
                <MapPin className="size-[18px] text-[var(--es-warn-600)]" />
              </div>
            )}
          </div>
          <div className="flex items-center justify-between px-4 py-3.5">
            {gpsStatus === "loading" ? (
              <div className="text-[13px] text-muted-foreground">{t.clock.acquiringGPS}</div>
            ) : gpsStatus === "denied" ? (
              <div className="flex items-center gap-1.5 text-[13px] text-[var(--es-warn-600)]">
                <AlertTriangle className="size-3.5" /> {t.clock.gpsUnavailable}
              </div>
            ) : coords ? (
              <div>
                <div className="text-[13px] font-medium">{t.clock.currentLocation}</div>
                <div className="text-[11px] text-muted-foreground">{locationLabel}</div>
              </div>
            ) : null}
            {coords && (
              <StatusPill tone="success">{t.clock.accuracy} ±{Math.round(coords.accuracy)} m</StatusPill>
            )}
          </div>
        </div>

<div>
          <SectionLabel>{t.clock.workLocation}</SectionLabel>
          <PillToggleGroup
            options={locations}
            value={location}
            onChange={setLocation}
            variant="filled"
            scroll
            ariaLabel={t.clock.workLocation}
          />
        </div>

{clockState === "done" ? (
          <div className="animate-in fade-in zoom-in-95 duration-300 rounded-xl border border-[var(--es-success-500)] bg-[var(--es-success-50)] p-5 text-center shadow-[var(--es-shadow-sm)]">
            <div className="animate-in zoom-in-50 duration-300 delay-100 fill-mode-backwards mx-auto mb-2.5 grid size-12 place-items-center rounded-full bg-[var(--es-success-600)]">
              <Check className="size-[26px] text-white" />
            </div>
            <div className="text-lg font-bold text-[var(--es-success-700)]">
              {t.clock.clockRecorded.replace("{type}", clockType === "IN" ? t.clock.clockInLabel : t.clock.clockOutLabel)}
            </div>
            <div className="tabular-nums mt-1 text-[28px] font-bold">{clockedTime}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {t.clock.clockedAt.replace("{location}", locationLabel)}{coords ? ` · GPS ±${Math.round(coords.accuracy)} m` : ""}
            </div>
            <button type="button" onClick={reset} className="mt-3 text-sm font-medium text-[var(--es-accent-600)]">
              {t.clock.clockNow.replace("{type}", clockType === "IN" ? t.clock.clockOutLabel : t.clock.clockInLabel)}
            </button>
            <Link
              href="/employee/today"
              className="mt-1 block text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.clock.backToToday}
            </Link>
          </div>
        ) : (
          <button
            type="button"
            aria-label={clockType === "IN" ? t.clock.clockInLabel : t.clock.clockOutLabel}
            disabled={clockState === "clocking" || clockState === "loading"}
            onClick={() => { hapticTap(); handleClock(); }}
            className={cn(
              "flex min-h-[110px] flex-col items-center justify-center gap-1.5 rounded-[20px] text-[22px] font-bold text-white shadow-[0_8px_24px_rgba(61,70,204,0.35)] transition-colors",
              clockState === "clocking" || clockState === "loading"
                ? "bg-[var(--es-accent-700)]"
                : "bg-[var(--es-accent-600)] hover:bg-[var(--es-accent-700)]",
            )}
          >
            <Clock className="size-7" aria-hidden />
            {
              { loading: t.common.loading, clocking: t.clock.recording, idle: t.clock.clockNow.replace("{type}", clockType === "IN" ? t.clock.clockInLabel : t.clock.clockOutLabel), error: t.clock.clockNow.replace("{type}", clockType === "IN" ? t.clock.clockInLabel : t.clock.clockOutLabel), done: "" }[clockState]
            }
            <span className="text-xs font-medium opacity-85">
              {clockState === "loading" ? t.clock.checkingStatus : t.clock.tapToClock.replace("{type}", clockType === "IN" ? t.clock.clockInLabel : t.clock.clockOutLabel)}
            </span>
          </button>
        )}

        <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">
          {disclaimer}
        </p>
      </div>
    </>
  );
}
