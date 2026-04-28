// ════════════════════════════════════════════════════════════════
// Bootstrap Admin — one-shot prod seeding for the first HR user
// ────────────────────────────────────────────────────────────────
// Use case: after the very first deploy, the prod DB has zero
// Employee records. The first user signs in via magic link, gets a
// User row auto-created by Auth.js, but lands on /forbidden because
// they have no Employee + roles.
//
// This script links one Employee record (with HRMG + HR_AUTHORIZED
// roles) to that User so they can access /hr admin and onboard the
// real workforce through the UI.
//
// Run (one time, locally with prod DATABASE_URL):
//   $ DATABASE_URL="postgres://..." \
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

  const user = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
    include: { employee: true },
  });

  if (!user) {
    throw new Error(
      `User not found for email "${ADMIN_EMAIL}". ` +
        `Sign in via magic link once first to auto-create the User row, then re-run this script.`,
    );
  }

  if (user.employee) {
    console.log(
      `ℹ  Employee already exists (id=${user.employee.id}, code=${user.employee.employeeCode}). Updating roles + status.`,
    );
  }

  const employee = await prisma.employee.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
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
  console.log("\n→ Sign in again at /signin to land on /hr/overview");
}

main()
  .catch((err) => {
    console.error("❌ Bootstrap failed:", err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
