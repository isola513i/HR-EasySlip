// ════════════════════════════════════════════════════════════════
// Bootstrap Admin — one-shot prod seeding for the first HR user
// ────────────────────────────────────────────────────────────────
// Use case: after the very first deploy, the prod DB has zero
// Employee records. The first user signs in via magic link, gets a
// User row auto-created by Auth.js in the Control Plane DB, but
// lands on /forbidden because they have no Employee + roles.
//
// This script links one Employee record (with HRMG + HR_AUTHORIZED
// roles) to that CP User so they can access /hr admin and onboard
// the real workforce through the UI.
//
// Run (one time, locally with prod credentials):
//   $ DATABASE_URL="postgres://..." \
//     CONTROL_PLANE_DATABASE_URL="postgres://..." \
//     SEED_TENANT_ID="<tenantId>" \
//     ADMIN_EMAIL="development.v001@gmail.com" \
//     bun prisma/bootstrap-admin.ts
//
// Idempotent: upserts by userId. Safe to re-run.
// ════════════════════════════════════════════════════════════════

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ log: ["warn", "error"] });

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL ?? "development.v001@gmail.com";

const ADMIN = {
  employeeCode: "ES0001",
  firstNameTh: "Admin",
  lastNameTh: "Tester",
  firstNameEn: "Admin",
  lastNameEn: "Tester",
  hireDate: new Date("2026-01-01"),
  roles: ["HRMG", "HR_AUTHORIZED"] as const,
  employmentStatus: "ACTIVE" as const,
};

async function main() {
  console.log(`🔧 Bootstrap admin for: ${ADMIN_EMAIL}`);

  const { getControlPlane } = await import("../lib/db/control-plane");
  const cp = getControlPlane();

  // 1. Resolve User from Control Plane DB
  const cpUser = await cp.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!cpUser) {
    throw new Error(
      `CP User not found for email "${ADMIN_EMAIL}". ` +
        `Sign in via magic link once first to auto-create the User row in the Control Plane, then re-run this script.`,
    );
  }

  // 2. Check existing employee in tenant DB
  const existingEmp = await prisma.employee.findFirst({
    where: { userId: cpUser.id },
  });

  if (existingEmp) {
    console.log(
      `ℹ  Employee already exists (id=${existingEmp.id}, code=${existingEmp.employeeCode}). Updating roles + status.`,
    );
  }

  // 3. Upsert employee in tenant DB
  const employee = await prisma.employee.upsert({
    where: { userId: cpUser.id },
    create: {
      userId: cpUser.id,
      employeeCode: ADMIN.employeeCode,
      firstNameTh: ADMIN.firstNameTh,
      lastNameTh: ADMIN.lastNameTh,
      firstNameEn: ADMIN.firstNameEn,
      lastNameEn: ADMIN.lastNameEn,
      hireDate: ADMIN.hireDate,
      roles: [...ADMIN.roles],
      employmentStatus: ADMIN.employmentStatus,
    },
    update: {
      roles: [...ADMIN.roles],
      employmentStatus: ADMIN.employmentStatus,
    },
  });

  console.log("\n✅ Admin Employee ready:");
  console.log(`   id:           ${employee.id}`);
  console.log(`   userId:       ${employee.userId}`);
  console.log(`   employeeCode: ${employee.employeeCode}`);
  console.log(`   name:         ${employee.firstNameTh} ${employee.lastNameTh}`);
  console.log(`   roles:        ${employee.roles.join(", ")}`);
  console.log(`   status:       ${employee.employmentStatus}`);

  // 4. Upsert TenantMembership in CP (requires SEED_TENANT_ID)
  const tenantId = process.env.SEED_TENANT_ID;
  if (!tenantId) {
    console.warn(
      "\n⚠  SEED_TENANT_ID not set — skipping TenantMembership upsert.",
    );
    console.warn(
      "   Re-run with SEED_TENANT_ID=<tenantId> to link the membership.",
    );
  } else {
    await cp.tenantMembership.upsert({
      where: { userId_tenantId: { userId: cpUser.id, tenantId } },
      create: {
        userId: cpUser.id,
        tenantId,
        role: "HRMG",
        employeeRecordId: employee.id,
        status: "ACTIVE",
      },
      update: {
        role: "HRMG",
        employeeRecordId: employee.id,
      },
    });
    console.log(`\n✅ TenantMembership upserted (tenantId=${tenantId})`);
  }

  console.log("\n→ Sign in again at /signin to land on /hr/overview");
}

main()
  .catch((err) => {
    console.error("❌ Bootstrap failed:", err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
