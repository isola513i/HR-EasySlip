// ════════════════════════════════════════════════════════════════
// Seed: Departments & Positions
// ────────────────────────────────────────────────────────────────
// Department: uses `code` as stable key for idempotent upsert
// Position: shared across departments (level 1-5)
// ════════════════════════════════════════════════════════════════

import type { Prisma, PrismaClient } from '@prisma/client';

export type OrgMap = {
  departments: Map<string, string>; // code → id
  positions: Map<string, string>; // name → id
};

const DEPARTMENTS: Array<Prisma.DepartmentCreateInput> = [
  { name: 'Executive', code: 'EXEC' },
  { name: 'Engineering', code: 'ENG' },
  { name: 'Design', code: 'DSGN' },
  { name: 'Marketing', code: 'MKT' },
  { name: 'Human Resources', code: 'HR' },
  { name: 'Finance', code: 'FIN' },
];

const POSITIONS: Array<{ name: string; level: number }> = [
  // Executive (level 5)
  { name: 'Chief Executive Officer', level: 5 },
  { name: 'Chief Technology Officer', level: 5 },
  { name: 'Chief Operating Officer', level: 5 },
  // HR & Management (level 4)
  { name: 'HR Manager', level: 4 },
  { name: 'HR Specialist', level: 3 },
  { name: 'Engineering Manager', level: 4 },
  { name: 'Product Manager', level: 4 },
  { name: 'Design Manager', level: 4 },
  { name: 'Marketing Manager', level: 4 },
  { name: 'Finance Manager', level: 4 },
  // Individual Contributors (level 2-3)
  { name: 'Senior Software Engineer', level: 3 },
  { name: 'Software Engineer', level: 2 },
  { name: 'Junior Developer', level: 1 }, // probation / part-time
  { name: 'Product Designer', level: 3 },
  { name: 'Marketing Executive', level: 2 },
  { name: 'Accountant', level: 2 },
];

export async function seedOrganization(prisma: PrismaClient): Promise<OrgMap> {
  const departments = new Map<string, string>();
  const positions = new Map<string, string>();

  for (const dept of DEPARTMENTS) {
    const record = await prisma.department.upsert({
      where: { code: dept.code },
      create: dept,
      update: { name: dept.name },
    });
    departments.set(dept.code, record.id);
  }

  for (const pos of POSITIONS) {
    const record = await prisma.position.upsert({
      where: { name: pos.name },
      create: pos,
      update: { level: pos.level },
    });
    positions.set(pos.name, record.id);
  }

  return { departments, positions };
}
