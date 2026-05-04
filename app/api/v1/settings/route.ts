import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiRoles, HR_ROLES } from "@/lib/security/rbac";
import {
  SettingUpdateSchema,
  SettingBatchUpdateSchema,
} from "@/lib/settings/schemas";
import {
  listSettings,
  updateSetting,
  updateSettingsBatch,
} from "@/lib/settings/settings-service";
import { listDefinitions } from "@/lib/settings/registry";

export const GET = withApiHandler(async () => {
  const caller = await requireApiRoles(HR_ROLES);
  if (caller instanceof NextResponse) return caller;

  const [settings, definitions] = await Promise.all([
    listSettings(),
    Promise.resolve(listDefinitions()),
  ]);

  // Merge DB rows with registry metadata so the UI gets group, inputType,
  // unit, min/max, and default in one fetch. Rows missing from DB still
  // surface (using their registry default) so admins can never end up with
  // an unconfigured setting silently dropped from the UI.
  const byKey = new Map(settings.map((s) => [s.key, s]));
  const merged = definitions
    .sort((a, b) => (a.group === b.group ? a.order - b.order : a.group.localeCompare(b.group)))
    .map((def) => {
      const row = byKey.get(def.key);
      return {
        key: def.key,
        value: row ? row.value : def.defaultValue,
        defaultValue: def.defaultValue,
        description: row?.description ?? null,
        group: def.group,
        inputType: def.inputType,
        unitKey: def.unitKey ?? null,
        order: def.order,
        min: def.min ?? null,
        max: def.max ?? null,
        step: def.step ?? null,
        updatedBy: row?.updatedBy ?? null,
        updatedAt: row?.updatedAt ?? null,
      };
    });

  return apiOk(merged);
});

export const PUT = withApiHandler(async (req, ctx) => {
  const caller = await requireApiRoles(HR_ROLES);
  if (caller instanceof NextResponse) return caller;

  const input = await parseBody(req, SettingUpdateSchema);
  const updated = await updateSetting(input, caller.userId, {
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });
  return apiOk(updated);
});

export const PATCH = withApiHandler(async (req, ctx) => {
  const caller = await requireApiRoles(HR_ROLES);
  if (caller instanceof NextResponse) return caller;

  const input = await parseBody(req, SettingBatchUpdateSchema);
  const updated = await updateSettingsBatch(input, caller.userId, {
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });
  return apiOk(updated);
});
