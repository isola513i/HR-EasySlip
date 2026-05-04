"use client";

import { useState } from "react";
import { Crosshair, ExternalLink, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useT } from "@/lib/i18n/locale-context";
import type { SettingValue } from "@/hooks/use-settings";

interface Props {
  currentLat: number;
  currentLng: number;
  onPick: (updates: Array<{ key: string; value: SettingValue }>) => void;
}

function osmLink(lat: number, lng: number) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`;
}

export function GeofenceLocationHelper({ currentLat, currentLng, onPick }: Props) {
  const t = useT();
  const dict = t.hr.settings.geofence;
  const [locating, setLocating] = useState(false);

  function handleUseLocation() {
    if (!("geolocation" in navigator)) {
      toast.error(dict.locationFailed);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        onPick([
          { key: "attendance.geofence.center_lat", value: lat },
          { key: "attendance.geofence.center_lng", value: lng },
        ]);
      },
      () => {
        setLocating(false);
        toast.error(dict.locationFailed);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  const hint = dict.coordsHint
    .replace("{lat}", currentLat.toFixed(6))
    .replace("{lng}", currentLng.toFixed(6));

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/40 px-4 py-3 text-[12px]">
      <div className="flex items-center gap-2 text-muted-foreground">
        <MapPin className="size-3.5" />
        <span className="tabular-nums">{hint}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={handleUseLocation} disabled={locating}>
          <Crosshair className="mr-1.5 size-3.5" />
          {locating ? dict.locating : dict.useMyLocation}
        </Button>
        <a
          href={osmLink(currentLat, currentLng)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[12px] text-[var(--es-accent-600)] hover:underline"
        >
          {dict.viewMap}
          <ExternalLink className="size-3" />
        </a>
      </div>
    </div>
  );
}
