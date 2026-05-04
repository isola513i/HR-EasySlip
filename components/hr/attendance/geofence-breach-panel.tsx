"use client";

import { useEffect, useState } from "react";
import { MapPin, ExternalLink, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api/client";
import { useT } from "@/lib/i18n/locale-context";
import { useFormat } from "@/hooks/use-format";

interface Breach {
  recordId: string;
  employeeId: string;
  employeeCode: string;
  firstNameTh: string;
  lastNameTh: string;
  clockType: "IN" | "OUT";
  clockedAt: string;
  workLocation: string;
  distanceMeters: number | null;
  radiusMeters: number | null;
  latitude: number | null;
  longitude: number | null;
}

interface Props {
  from: string;
  to: string;
}

function osmLink(lat: number, lng: number) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`;
}

export function GeofenceBreachPanel({ from, to }: Props) {
  const t = useT();
  const fmt = useFormat();
  const dict = t.hr.geofenceBreaches;
  const [data, setData] = useState<Breach[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiFetch<Breach[]>(`/api/v1/hr/geofence/breaches?from=${from}&to=${to}`)
      .then((r) => { if (!cancelled) setData(r); })
      .catch(() => { if (!cancelled) setData([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [from, to]);

  const today = new Date().toISOString().slice(0, 10);
  const todayCount = (data ?? []).filter((b) => b.clockedAt.slice(0, 10) === today).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-amber-600" />
              {dict.title}
            </CardTitle>
            <CardDescription className="text-[12px]">{dict.subtitle}</CardDescription>
          </div>
          {todayCount > 0 && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              {dict.todayBadge.replace("{count}", String(todayCount))}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        ) : data && data.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">{dict.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">{dict.tableEmployee}</th>
                  <th className="px-3 py-2 text-left font-medium">{dict.tableTime}</th>
                  <th className="px-3 py-2 text-left font-medium">{dict.tableType}</th>
                  <th className="px-3 py-2 text-right font-medium">{dict.tableDistance}</th>
                  <th className="px-3 py-2 text-right font-medium">{dict.tableLocation}</th>
                </tr>
              </thead>
              <tbody>
                {data?.map((b) => (
                  <tr key={b.recordId} className="border-t border-border">
                    <td className="px-3 py-2">
                      <div className="font-medium">{b.firstNameTh} {b.lastNameTh}</div>
                      <div className="text-[11px] text-muted-foreground">{b.employeeCode}</div>
                    </td>
                    <td className="px-3 py-2 tabular-nums">{fmt.formatDateTime(b.clockedAt)}</td>
                    <td className="px-3 py-2">
                      <Badge variant="outline" className="text-[10px]">
                        {b.clockType === "IN" ? dict.clockTypeIN : dict.clockTypeOUT}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {b.distanceMeters !== null && b.radiusMeters !== null ? (
                        <span className="text-amber-700 dark:text-amber-400">
                          {b.distanceMeters}m / {b.radiusMeters}m
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {b.latitude !== null && b.longitude !== null ? (
                        <a
                          href={osmLink(b.latitude, b.longitude)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[12px] text-[var(--es-accent-600)] hover:underline"
                        >
                          <MapPin className="size-3.5" />
                          {dict.viewMap}
                          <ExternalLink className="size-3" />
                        </a>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
