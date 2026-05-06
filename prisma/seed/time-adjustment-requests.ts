// ════════════════════════════════════════════════════════════════
// Seed: TimeAdjustmentRequest (clock-correction) — populates the
// manager time-adjustment-inbox + powers the "view attachments"
// inline-expand smoke test from Phase 2 P3.
// ════════════════════════════════════════════════════════════════

import type { PrismaClient } from "@prisma/client";
import type { EmployeeRecord } from "./employees";

export async function seedTimeAdjustmentRequests(
  prisma: PrismaClient,
  employeeMap: Map<string, EmployeeRecord>,
): Promise<number> {
  const get = (code: string) => employeeMap.get(code);

  const suda = get("ES0011");
  const nattapol = get("ES0012");
  const piyanuch = get("ES0014");
  const mgrEng = get("ES0006");
  const mgrMkt = get("ES0008");

  if (!suda || !nattapol || !piyanuch || !mgrEng || !mgrMkt) {
    throw new Error("Required employees missing for time-adjustment seeding");
  }

  // Idempotent reseed
  await prisma.timeAdjustmentRequest.deleteMany({
    where: { employeeId: { in: [suda.id, nattapol.id, piyanuch.id] } },
  });

  // 1. PENDING — Suda forgot clock-out yesterday
  const sudaPending = await prisma.timeAdjustmentRequest.create({
    data: {
      employeeId: suda.id,
      clockType: "OUT",
      requestedAt: new Date("2026-05-04T18:15:00+07:00"),
      reason: "ลืมแสกนออกตอนเย็น ออกจริง 18:15",
      status: "PENDING",
      approverId: mgrEng.id,
    },
  });

  // 2. PENDING — Nattapol came in early without scanning
  await prisma.timeAdjustmentRequest.create({
    data: {
      employeeId: nattapol.id,
      clockType: "IN",
      requestedAt: new Date("2026-05-05T08:30:00+07:00"),
      reason: "ระบบ scanner ค้าง เข้าจริง 08:30 มีกล้องวงจรปิดยืนยัน",
      status: "PENDING",
      approverId: mgrEng.id,
    },
  });

  // 3. APPROVED — Piyanuch's last week correction
  await prisma.timeAdjustmentRequest.create({
    data: {
      employeeId: piyanuch.id,
      clockType: "OUT",
      requestedAt: new Date("2026-04-30T19:45:00+07:00"),
      reason: "ทำ OT แต่ลืมแสกนออก",
      status: "APPROVED",
      approverId: mgrMkt.id,
      approvedAt: new Date("2026-05-01T09:12:00+07:00"),
    },
  });

  // 4. Phase 2 P3 — attach a proof Document to the PENDING request so the
  // manager inbox shows hasAttachment + the inline-expand pill.
  await prisma.document.create({
    data: {
      ownerEmployeeId: suda.id,
      category: "time_correction_proof",
      entityType: "TimeAdjustmentRequest",
      entityId: sudaPending.id,
      blobPath: `https://example.invalid/seed-blob/time-corrections/${sudaPending.id}-screenshot.jpg`,
      filename: "out-screenshot.jpg",
      mime: "image/jpeg",
      size: 96_000,
      uploadedById: suda.userId,
      uploadedAt: new Date("2026-05-04T18:30:00+07:00"),
    },
  });

  return 3;
}
