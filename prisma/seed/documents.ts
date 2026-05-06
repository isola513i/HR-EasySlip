// ════════════════════════════════════════════════════════════════
// Seed: Profile pictures + Documents (Phase 2 visibility)
// ────────────────────────────────────────────────────────────────
// Avatars use pravatar.cc — the /profile-picture proxy fetches
// arbitrary URLs through Vercel Blob's `fetch()` so any reachable
// image works for dev. Documents use a placeholder URL that won't
// 200 on /file fetch — list view + RBAC paths still render fine,
// which is what we need for visibility.
// ════════════════════════════════════════════════════════════════

import type { PrismaClient } from "@prisma/client";
import type { EmployeeRecord } from "./employees";

const PLACEHOLDER_BASE = "https://example.invalid/seed-blob";

function avatarUrl(seed: string): string {
  return `https://i.pravatar.cc/300?u=${encodeURIComponent(seed)}`;
}

export async function seedDocuments(
  prisma: PrismaClient,
  employeeMap: Map<string, EmployeeRecord>,
): Promise<{ pictures: number; documents: number }> {
  const get = (code: string) => employeeMap.get(code);

  const ice = get("ES0010") ?? get("ES0011"); // employee
  const suda = get("ES0011");
  const nattapol = get("ES0012");
  const piyanuch = get("ES0014");
  const hrmg = get("ES0004");
  const ceo = get("ES0001");

  if (!ice || !suda || !nattapol || !piyanuch || !hrmg || !ceo) {
    throw new Error("Required employees missing for documents seeding");
  }

  // ─── Profile pictures (3 employees + 1 exec) ───
  const picTargets = [ice, suda, piyanuch, ceo];
  for (const emp of picTargets) {
    await prisma.employee.update({
      where: { id: emp.id },
      data: {
        profilePicturePath: avatarUrl(emp.code),
        profilePictureMime: "image/jpeg",
        profilePictureUploadedAt: new Date("2026-04-01"),
      },
    });
  }

  // ─── Documents — clean slate per owner so reseed is idempotent ───
  const ownerIds = [ice.id, suda.id, nattapol.id, piyanuch.id];
  await prisma.document.deleteMany({ where: { ownerEmployeeId: { in: ownerIds } } });

  // 1. HR-uploaded contracts (HR-only write)
  await prisma.document.create({
    data: {
      ownerEmployeeId: ice.id,
      category: "contract",
      entityType: "Employee",
      entityId: ice.id,
      blobPath: `${PLACEHOLDER_BASE}/contracts/${ice.code}-employment-2026.pdf`,
      filename: `${ice.code}-employment-contract-2026.pdf`,
      mime: "application/pdf",
      size: 248_000,
      uploadedById: hrmg.userId,
      uploadedAt: new Date("2026-01-10"),
    },
  });
  await prisma.document.create({
    data: {
      ownerEmployeeId: suda.id,
      category: "contract",
      entityType: "Employee",
      entityId: suda.id,
      blobPath: `${PLACEHOLDER_BASE}/contracts/${suda.code}-employment-2026.pdf`,
      filename: `${suda.code}-employment-contract-2026.pdf`,
      mime: "application/pdf",
      size: 256_000,
      uploadedById: hrmg.userId,
      uploadedAt: new Date("2026-02-03"),
    },
  });

  // 2. Employee-uploaded certificate
  await prisma.document.create({
    data: {
      ownerEmployeeId: piyanuch.id,
      category: "certificate",
      entityType: "Employee",
      entityId: piyanuch.id,
      blobPath: `${PLACEHOLDER_BASE}/certificates/${piyanuch.code}-aws-saa.pdf`,
      filename: "aws-solutions-architect.pdf",
      mime: "application/pdf",
      size: 612_000,
      uploadedById: piyanuch.userId,
      uploadedAt: new Date("2026-03-15"),
    },
  });

  // 3. Employee-uploaded general (ID copy)
  await prisma.document.create({
    data: {
      ownerEmployeeId: ice.id,
      category: "general",
      entityType: "Employee",
      entityId: ice.id,
      blobPath: `${PLACEHOLDER_BASE}/general/${ice.code}-id-card.jpg`,
      filename: "id-card-front.jpg",
      mime: "image/jpeg",
      size: 184_000,
      uploadedById: ice.userId,
      uploadedAt: new Date("2026-01-12"),
    },
  });

  // 4. Leave attachment — link to an existing seeded SICK leave request
  const sudaSickLeave = await prisma.leaveRequest.findFirst({
    where: { employeeId: suda.id, leaveType: "SICK", status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
  if (sudaSickLeave) {
    await prisma.document.create({
      data: {
        ownerEmployeeId: suda.id,
        category: "leave_attachment",
        entityType: "LeaveRequest",
        entityId: sudaSickLeave.id,
        blobPath: `${PLACEHOLDER_BASE}/leave/${sudaSickLeave.id}-medical-cert.jpg`,
        filename: "medical-cert.jpg",
        mime: "image/jpeg",
        size: 142_000,
        uploadedById: suda.userId,
        uploadedAt: new Date("2026-04-26"),
      },
    });
  }

  return { pictures: picTargets.length, documents: sudaSickLeave ? 5 : 4 };
}
