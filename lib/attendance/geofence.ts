import { getSettingValues } from "@/lib/settings/settings-service";

export interface GeofenceConfig {
  enforce: boolean;
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
}

export interface GeofenceEvaluation {
  enforced: boolean;
  inside: boolean;
  distanceMeters: number | null;
  config: GeofenceConfig;
}

const KEYS = [
  "attendance.gps.enforce_geofence",
  "attendance.geofence.center_lat",
  "attendance.geofence.center_lng",
  "attendance.geofence.radius_meters",
] as const;

export async function loadGeofenceConfig(): Promise<GeofenceConfig> {
  const values = await getSettingValues(KEYS as unknown as string[]);
  return {
    enforce: Boolean(values["attendance.gps.enforce_geofence"]),
    centerLat: Number(values["attendance.geofence.center_lat"] ?? 0),
    centerLng: Number(values["attendance.geofence.center_lng"] ?? 0),
    radiusMeters: Number(values["attendance.geofence.radius_meters"] ?? 0),
  };
}

/** Haversine distance in meters between two lat/lng pairs. */
export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371_000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * Evaluates a clock-in coordinate against the configured geofence.
 * Returns null distance when no GPS coords were provided (treated as inside —
 * spec says geofence is log-only soft warning, never blocks clock-in).
 */
export async function evaluateGeofence(
  lat: number | undefined,
  lng: number | undefined,
): Promise<GeofenceEvaluation> {
  const config = await loadGeofenceConfig();
  if (!config.enforce || lat === undefined || lng === undefined) {
    return { enforced: config.enforce, inside: true, distanceMeters: null, config };
  }
  const distance = haversineMeters(lat, lng, config.centerLat, config.centerLng);
  return {
    enforced: true,
    inside: distance <= config.radiusMeters,
    distanceMeters: Math.round(distance),
    config,
  };
}
