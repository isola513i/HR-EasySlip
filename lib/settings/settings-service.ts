import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { DomainError, ErrorCodes } from "@/lib/api/errors";
import { getDefinition, validateSettingValue, SETTINGS_REGISTRY } from "./registry";
import { assertCrossFieldValid } from "./cross-field-rules";
import type { SettingUpdateInput, SettingBatchUpdateInput } from "./schemas";

async function loadAllValues(): Promise<Record<string, string | number | boolean>> {
  const rows = await prisma.systemConfig.findMany();
  const result: Record<string, string | number | boolean> = {};
  for (const row of rows) {
    if (typeof row.value === "string" || typeof row.value === "number" || typeof row.value === "boolean") {
      result[row.key] = row.value;
    }
  }
  return result;
}

interface AuditMeta {
  ipAddress?: string;
  userAgent?: string;
}

export async function listSettings() {
  return prisma.systemConfig.findMany({ orderBy: { key: "asc" } });
}

export async function updateSetting(
  input: SettingUpdateInput,
  userId: string,
  meta?: AuditMeta,
) {
  const def = getDefinition(input.key);
  if (!def) {
    throw new DomainError("UNKNOWN_SETTING_KEY", { key: input.key }, 400);
  }

  let coerced: string | number | boolean;
  try {
    coerced = validateSettingValue(input.key, input.value);
  } catch (err) {
    const message = err instanceof Error ? err.message : "INVALID_VALUE";
    throw new DomainError("INVALID_SETTING_VALUE", { key: input.key, message }, 400);
  }

  const existing = await prisma.systemConfig.findUnique({ where: { key: input.key } });
  if (!existing) {
    throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, { key: input.key }, 404);
  }

  const currentValues = await loadAllValues();
  assertCrossFieldValid(currentValues, [{ key: input.key, value: coerced }]);

  const updated = await prisma.systemConfig.update({
    where: { key: input.key },
    data: { value: coerced as never, updatedBy: userId },
  });

  await writeAuditLog({
    actorId: userId,
    action: "settings.update",
    entityType: "SystemConfig",
    entityId: input.key,
    before: existing,
    after: updated,
    ipAddress: meta?.ipAddress,
    userAgent: meta?.userAgent,
  });

  return updated;
}

export async function updateSettingsBatch(
  input: SettingBatchUpdateInput,
  userId: string,
  meta?: AuditMeta,
) {
  // Pre-validate ALL entries first — atomic semantics: reject the whole batch on any error
  const coerced = input.updates.map((u) => {
    const def = getDefinition(u.key);
    if (!def) {
      throw new DomainError("UNKNOWN_SETTING_KEY", { key: u.key }, 400);
    }
    try {
      return { key: u.key, value: validateSettingValue(u.key, u.value) };
    } catch (err) {
      const message = err instanceof Error ? err.message : "INVALID_VALUE";
      throw new DomainError("INVALID_SETTING_VALUE", { key: u.key, message }, 400);
    }
  });

  const keys = coerced.map((c) => c.key);
  const existingRows = await prisma.systemConfig.findMany({ where: { key: { in: keys } } });
  if (existingRows.length !== keys.length) {
    const found = new Set(existingRows.map((r) => r.key));
    const missing = keys.filter((k) => !found.has(k));
    throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, { keys: missing }, 404);
  }
  const beforeMap = new Map(existingRows.map((r) => [r.key, r]));

  const currentValues = await loadAllValues();
  assertCrossFieldValid(currentValues, coerced);

  const updated = await prisma.$transaction(
    coerced.map((c) =>
      prisma.systemConfig.update({
        where: { key: c.key },
        data: { value: c.value as never, updatedBy: userId },
      }),
    ),
  );

  await Promise.all(
    updated.map((row) =>
      writeAuditLog({
        actorId: userId,
        action: "settings.update",
        entityType: "SystemConfig",
        entityId: row.key,
        before: beforeMap.get(row.key) ?? null,
        after: row,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      }),
    ),
  );

  return updated;
}

export async function resetSettingToDefault(
  key: string,
  userId: string,
  meta?: AuditMeta,
) {
  const def = getDefinition(key);
  if (!def) {
    throw new DomainError("UNKNOWN_SETTING_KEY", { key }, 400);
  }
  return updateSetting({ key, value: def.defaultValue }, userId, meta);
}

/**
 * Read a setting value with type coercion. Falls back to the registry default
 * if the row is missing or invalid. Used by services that depend on settings
 * (e.g. attendance late threshold, geofence enforcement).
 */
export async function getSettingValue<T extends string | number | boolean>(
  key: string,
): Promise<T> {
  const def = getDefinition(key);
  if (!def) {
    throw new Error(`UNKNOWN_SETTING_KEY:${key}`);
  }
  const row = await prisma.systemConfig.findUnique({ where: { key } });
  if (!row) return def.defaultValue as T;
  try {
    return validateSettingValue(key, row.value) as T;
  } catch {
    return def.defaultValue as T;
  }
}

/** Bulk read for services that need many settings at once (e.g. geofence). */
export async function getSettingValues(
  keys: string[],
): Promise<Record<string, string | number | boolean>> {
  const rows = await prisma.systemConfig.findMany({ where: { key: { in: keys } } });
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const result: Record<string, string | number | boolean> = {};
  for (const key of keys) {
    const def = SETTINGS_REGISTRY[key];
    if (!def) continue;
    const raw = map.get(key);
    if (raw === undefined) {
      result[key] = def.defaultValue;
      continue;
    }
    try {
      result[key] = validateSettingValue(key, raw);
    } catch {
      result[key] = def.defaultValue;
    }
  }
  return result;
}
