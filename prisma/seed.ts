// ════════════════════════════════════════════════════════════════
// EasySlip HR System — Prisma Seed (MOCK-UP / DEV ONLY)
// ────────────────────────────────────────────────────────────────
// Run:
//   $ bun prisma db seed
//   (configured in package.json > prisma.seed)
//
// Idempotent: uses upsert by unique keys (email, employeeCode, etc.)
// Safe to re-run without duplicating records.
//
// TESTING STRATEGY:
//   All mock users route to development.v001@gmail.com via Gmail
//   plus-addressing (dev.v001+role@gmail.com). Ice can sign in with
//   any role by sending magic link to the aliased address.
// ════════════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client';
import { seedOrganization } from './seed/organization';
import { seedEmployees } from './seed/employees';
import { seedLeaveQuotas } from './seed/leave-quotas';
import { seedPublicHolidays } from './seed/public-holidays';
import { seedSystemConfig } from './seed/system-config';
import { seedPayrollCycle } from './seed/payroll-cycle';
import { seedAttendanceRecords } from './seed/attendance-records';
import { seedLeaveRequests } from './seed/leave-requests';
import { seedOnboardingTemplate } from './seed/onboarding-template';

const prisma = new PrismaClient({ log: ['warn', 'error'] });

async function main() {
  console.log('🌱 EasySlip HR — seeding dev data...\n');

  // Order matters: depts/positions → employees (needs dept/pos) →
  // leave quotas (needs employees) → holidays/config (independent)
  const orgMap = await seedOrganization(prisma);
  console.log(
    `  ✓ Organization: ${orgMap.departments.size} depts, ${orgMap.positions.size} positions`,
  );

  const employeeMap = await seedEmployees(prisma, orgMap);
  console.log(`  ✓ Employees: ${employeeMap.size} seeded\n`);

  await seedLeaveQuotas(prisma, employeeMap);
  console.log('  ✓ Leave quotas: 2026 seeded\n');

  const systemUserId = employeeMap.get('ES0004')?.userId;
  if (!systemUserId) {
    throw new Error('HRMG account (ES0004) must exist before seeding holidays');
  }
  await seedPublicHolidays(prisma, systemUserId);
  console.log('  ✓ Public holidays 2026: seeded\n');

  await seedSystemConfig(prisma, systemUserId);
  console.log('  ✓ System config: defaults seeded\n');

  await seedPayrollCycle(prisma);
  console.log('  ✓ Payroll cycles: Apr 2026 (OPEN) + Mar 2026 (LOCKED)\n');

  const attendanceCount = await seedAttendanceRecords(prisma, employeeMap);
  console.log(`  ✓ Attendance records: ${attendanceCount} seeded\n`);

  const leaveCount = await seedLeaveRequests(prisma, employeeMap);
  console.log(`  ✓ Leave requests: ${leaveCount} seeded\n`);

  await seedOnboardingTemplate(prisma, systemUserId);
  console.log('  ✓ Onboarding: default template seeded\n');

  console.log('✅ Seed complete.\n');
  console.log('📧 Sign-in emails (all route to development.v001@gmail.com):');
  console.log('   HRMG  → development.v001@gmail.com');
  console.log('   CEO   → dev.v001+ceo@gmail.com');
  console.log('   HR    → dev.v001+hr@gmail.com');
  console.log('   MGR   → dev.v001+mgr.eng@gmail.com');
  console.log('   EMP   → dev.v001+emp.ice@gmail.com');
  console.log('   (ดู prisma/seed/employees.ts สำหรับรายการเต็ม)\n');
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
