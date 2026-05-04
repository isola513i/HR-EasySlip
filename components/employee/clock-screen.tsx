"use client";

import { useEffect, useRef } from "react";
import { Clock, MapPin, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { StatusPill } from "@/components/shared/status-pill";
import { MobileTopbar } from "@/components/shared/mobile-topbar";
import { cn } from "@/lib/utils";
import { useClock, type LocationType } from "@/hooks/use-clock";
import { useT } from "@/lib/i18n/locale-context";
import { hapticError, hapticSuccess, hapticTap } from "@/lib/haptics";

export function ClockScreen() {
  const t = useT();

  const locations: { key: LocationType; label: string }[] = [
    { key: "OFFICE", label: t.clock.office },
    { key: "WFH", label: t.clock.wfh },
    { key: "ON_SITE", label: t.clock.onSite },
  ];
  const {
    clockState, clockType, location, setLocation,
    coords, gpsStatus, clockedTime, error, geofenceWarning, handleClock, reset,
  } = useClock();

  useEffect(() => { if (error) { toast.error(error); hapticError(); } }, [error]);

  useEffect(() => {
    if (!geofenceWarning) return;
    toast.warning(
      t.clock.geofenceWarning
        .replace("{distance}", String(geofenceWarning.distanceMeters))
        .replace("{radius}", String(geofenceWarning.radiusMeters)),
      { duration: 7000 },
    );
  }, [geofenceWarning, t.clock.geofenceWarning]);

  const lastClockState = useRef(clockState);
  useEffect(() => {
    if (lastClockState.current !== "done" && clockState === "done") hapticSuccess();
    lastClockState.current = clockState;
  }, [clockState]);

  const locationLabel =
    location === "OFFICE" ? "the office" : location === "WFH" ? "home" : "on-site";

  return (
    <>
      <MobileTopbar title={t.clock.title} backHref="/employee/today" />

      <div className="flex flex-col gap-4 p-4">
        {/* GPS preview card */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--es-shadow-sm)]">
          <div className="relative grid h-[140px] place-items-center border-b border-border bg-gradient-to-br from-[var(--es-neutral-50)] to-[var(--es-neutral-200)]">
            <svg className="absolute inset-0 opacity-50" width="100%" height="100%" viewBox="0 0 340 140">
              {Array.from({ length: 10 }).map((_, i) => (
                <line key={`h${i}`} x1="0" y1={i * 14} x2="340" y2={i * 14} stroke="#cbd3dd" strokeWidth="0.6" />
              ))}
              {Array.from({ length: 14 }).map((_, i) => (
                <line key={`v${i}`} x1={i * 26} y1="0" x2={i * 26} y2="140" stroke="#cbd3dd" strokeWidth="0.6" />
              ))}
            </svg>
            <div className="relative">
              <div className="grid size-9 place-items-center rounded-full bg-[var(--es-accent-600)] shadow-[0_0_0_8px_rgba(61,70,204,0.18)]">
                <MapPin className="size-[18px] text-white" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-3.5">
            {gpsStatus === "loading" ? (
              <div className="text-[13px] text-muted-foreground">{t.clock.acquiringGPS}</div>
            ) : gpsStatus === "denied" ? (
              <div className="flex items-center gap-1.5 text-[13px] text-[var(--es-warning-600)]">
                <AlertTriangle className="size-3.5" /> {t.clock.gpsUnavailable}
              </div>
            ) : coords ? (
              <div>
                <div className="text-[13px] font-medium">{t.clock.currentLocation}</div>
                <div className="font-mono text-[11px] text-muted-foreground">
                  {coords.latitude.toFixed(4)}°N, {coords.longitude.toFixed(4)}°E
                </div>
              </div>
            ) : null}
            {coords && (
              <StatusPill tone="success">{t.clock.accuracy} ±{Math.round(coords.accuracy)} m</StatusPill>
            )}
          </div>
        </div>

        {/* Location picker */}
        <div>
          <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {t.clock.workLocation}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {locations.map((loc) => {
              const sel = location === loc.key;
              return (
                <button
                  key={loc.key}
                  onClick={() => setLocation(loc.key)}
                  className={cn(
                    "rounded-[10px] px-2 py-3 text-left text-[13px] font-medium transition-colors",
                    sel
                      ? "border-[1.5px] border-[var(--es-accent-600)] bg-[var(--es-accent-50)] text-[var(--es-accent-700)]"
                      : "border border-[var(--es-neutral-300)] bg-card text-foreground hover:bg-muted",
                  )}
                >
                  <div className="text-[10px] uppercase tracking-widest opacity-70">{loc.key}</div>
                  {loc.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Clock action */}
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
            <button onClick={reset} className="mt-3 text-sm font-medium text-[var(--es-accent-600)]">
              {t.clock.clockNow.replace("{type}", clockType === "IN" ? t.clock.clockOutLabel : t.clock.clockInLabel)}
            </button>
          </div>
        ) : (
          <button
            disabled={clockState === "clocking" || clockState === "loading"}
            onClick={() => { hapticTap(); handleClock(); }}
            className={cn(
              "flex min-h-[110px] flex-col items-center justify-center gap-1.5 rounded-[20px] text-[22px] font-bold text-white shadow-[0_8px_24px_rgba(61,70,204,0.35)] transition-colors",
              clockState === "clocking" || clockState === "loading"
                ? "bg-[var(--es-accent-700)]"
                : "bg-[var(--es-accent-600)] hover:bg-[var(--es-accent-700)]",
            )}
          >
            <Clock className="size-7" />
            {
              { loading: t.common.loading, clocking: t.clock.recording, idle: t.clock.clockNow.replace("{type}", clockType === "IN" ? t.clock.clockInLabel : t.clock.clockOutLabel), error: t.clock.clockNow.replace("{type}", clockType === "IN" ? t.clock.clockInLabel : t.clock.clockOutLabel), done: "" }[clockState]
            }
            <span className="text-xs font-medium opacity-85">
              {clockState === "loading" ? t.clock.checkingStatus : t.clock.tapToClock.replace("{type}", clockType === "IN" ? t.clock.clockInLabel : t.clock.clockOutLabel)}
            </span>
          </button>
        )}

        <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">
          {t.clock.gpsDisclaimer}
        </p>
      </div>
    </>
  );
}
