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
//   development.v002@gmail.com uses email + password (manager123456).
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
import { seedOnboardingChecklists } from './seed/onboarding-checklists';
import { seedDocuments } from './seed/documents';
import { seedTimeAdjustmentRequests } from './seed/time-adjustment-requests';
import { seedOvertimeRequests } from './seed/overtime-requests';
import { seedPdpaConsents } from './seed/pdpa-consents';
import { seedExpenseClaims } from './seed/expense-claims';
import { seedSalaryAdjustments } from './seed/salary-adjustments';
import { seedAssets } from './seed/assets';
import { seedReviews } from './seed/reviews';
import { seedOffboarding } from './seed/offboarding';
import { seedGeofenceOverrides } from './seed/geofence-overrides';
import { seedAnnualLeaveCashOut } from './seed/annual-leave-cashout';
import { seedNotifications } from './seed/notifications';
import { seedAuditLogs } from './seed/audit-logs';
import { generateEmpeoFixture } from './seed/empeo-fixture';

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
  console.log('  ✓ Payroll cycles: Mar 2026 (LOCKED) + current 3 months (OPEN)\n');

  await generateEmpeoFixture();
  console.log('  ✓ Empeo fixture: public/Employee_Data_Report_All_Resign_Inc_08052026.xlsx\n');

  const attendanceCount = await seedAttendanceRecords(prisma, employeeMap);
  console.log(`  ✓ Attendance records: ${attendanceCount} seeded\n`);

  const leaveCount = await seedLeaveRequests(prisma, employeeMap);
  console.log(`  ✓ Leave requests: ${leaveCount} seeded\n`);

  await seedOnboardingTemplate(prisma, systemUserId);
  console.log('  ✓ Onboarding: default template seeded\n');

  const checklistCount = await seedOnboardingChecklists(prisma, employeeMap);
  console.log(`  ✓ Onboarding checklists: ${checklistCount} per-employee instances\n`);

  const docResult = await seedDocuments(prisma, employeeMap);
  console.log(`  ✓ Documents: ${docResult.pictures} avatars + ${docResult.documents} files\n`);

  const tarCount = await seedTimeAdjustmentRequests(prisma, employeeMap);
  console.log(`  ✓ Time adjustments: ${tarCount} requests + 1 attached proof\n`);

  const otCount = await seedOvertimeRequests(prisma, employeeMap);
  console.log(`  ✓ Overtime requests: ${otCount} seeded (PENDING + APPROVED)\n`);

  const consentCount = await seedPdpaConsents(prisma, employeeMap);
  console.log(`  ✓ PDPA consents: ${consentCount} granted\n`);

  // ── Phase 2+ features ──────────────────────────────────────────

  const expenseCount = await seedExpenseClaims(prisma, employeeMap);
  console.log(`  ✓ Expense claims: ${expenseCount} seeded\n`);

  const salaryCount = await seedSalaryAdjustments(prisma, employeeMap, systemUserId);
  console.log(`  ✓ Salary adjustments: ${salaryCount} records + baseSalary updated\n`);

  const assetResult = await seedAssets(prisma, employeeMap);
  console.log(`  ✓ Assets: ${assetResult.assets} items + ${assetResult.assignments} assignments\n`);

  const reviewResult = await seedReviews(prisma, employeeMap);
  console.log(`  ✓ Reviews: ${reviewResult.templates} template, ${reviewResult.cycles} cycle, ${reviewResult.reviews} reviews\n`);

  const offboardingCount = await seedOffboarding(prisma, employeeMap);
  console.log(`  ✓ Offboarding checklists: ${offboardingCount} seeded\n`);

  const geofenceCount = await seedGeofenceOverrides(prisma, employeeMap);
  console.log(`  ✓ Geofence overrides: ${geofenceCount} seeded\n`);

  const cashoutCount = await seedAnnualLeaveCashOut(prisma, employeeMap);
  console.log(`  ✓ Annual leave cash-outs: ${cashoutCount} seeded\n`);

  const notifCount = await seedNotifications(prisma, employeeMap);
  console.log(`  ✓ Notifications: ${notifCount} seeded\n`);

  const auditCount = await seedAuditLogs(prisma, employeeMap);
  console.log(`  ✓ Audit logs: ${auditCount} sample entries\n`);

  console.log('✅ Seed complete.\n');
  console.log('📧 Sign-in accounts:');
  console.log('   HRMG   → development.v001@gmail.com          (magic link)');
  console.log('   MGR2   → development.v002@gmail.com          (password: manager123456)');
  console.log('   CEO    → dev.v001+ceo@gmail.com              (magic link)');
  console.log('   HR     → dev.v001+hr@gmail.com               (magic link)');
  console.log('   MGR    → dev.v001+mgr.eng@gmail.com          (magic link)');
  console.log('   EMP    → dev.v001+emp.ice@gmail.com          (magic link)');
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
