"use server";

import { revalidatePath } from "next/cache";
import { getControlPlane } from "@/lib/db/control-plane";
import { requirePlatformSession } from "@/lib/auth/platform";
import { PLATFORM_ADMIN_ROLES } from "@/lib/security/platform-rbac";

type ActionResult = { error: string } | { success: true } | null;

const SLUG_RE = /^[a-z][a-z0-9_-]{1,30}$/;

function parseFeatures(raw: string): string[] {
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseNullableInt(raw: string | null): number | null {
  if (!raw || !raw.trim()) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function savePlan(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requirePlatformSession(PLATFORM_ADMIN_ROLES);

  const code = (formData.get("code") as string).trim().toLowerCase();
  const isNew = (formData.get("isNew") as string) === "1";
  const name = (formData.get("name") as string).trim();
  const priceTHB = parseNullableInt(formData.get("priceTHB") as string | null);
  const maxEmployees = parseNullableInt(formData.get("maxEmployees") as string | null);
  const features = parseFeatures((formData.get("features") as string) ?? "");
  const sortOrder = parseInt((formData.get("sortOrder") as string) ?? "0", 10) || 0;

  if (!code || !SLUG_RE.test(code)) {
    return { error: "Code must be 2–31 chars, lowercase, alphanumeric/-/_." };
  }
  if (!name) return { error: "Name is required." };
  if (features.length === 0) return { error: "At least one feature is required." };

  const cp = getControlPlane();

  if (isNew) {
    const existing = await cp.plan.findUnique({ where: { code }, select: { code: true } });
    if (existing) return { error: `Plan "${code}" already exists.` };
    await cp.plan.create({
      data: { code, name, priceTHB, maxEmployees, features, sortOrder },
    });
  } else {
    await cp.plan.update({
      where: { code },
      data: { name, priceTHB, maxEmployees, features, sortOrder },
    });
  }

  await cp.platformAuditLog.create({
    data: {
      actorId: session.userId,
      action: isNew ? "plan.create" : "plan.update",
      targetType: "Plan",
      targetId: code,
      metadata: { name, priceTHB, maxEmployees, featureCount: features.length },
    },
  });

  revalidatePath("/platform/plans");
  return { success: true };
}
