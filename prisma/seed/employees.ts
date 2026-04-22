// ════════════════════════════════════════════════════════════════
// Seed: Users + Employees (with manager tree)
// ────────────────────────────────────────────────────────────────
// All emails use Gmail plus-addressing → routes to
// development.v001@gmail.com so Ice can test all roles from one inbox.
//
// Two-pass creation:
//   Pass 1: Create User + Employee (managerId = null)
//   Pass 2: Resolve managerId from employeeCode references
// ════════════════════════════════════════════════════════════════

import type { EmploymentStatus, PrismaClient, Role } from '@prisma/client';
import type { OrgMap } from './organization';

type SeedEmployee = {
  code: string;
  email: string;
  firstNameTh: string;
  lastNameTh: string;
  firstNameEn?: string;
  lastNameEn?: string;
  roles: Role[];
  departmentCode: string;
  positionName: string;
  hireDate: string; // ISO date
  probationEndDate?: string; // ISO date
  employmentStatus: EmploymentStatus;
  managerCode?: string; // resolved in pass 2
};

const EMPLOYEES: SeedEmployee[] = [
  // ─── Executives ───
  {
    code: 'ES0001',
    email: 'dev.v001+ceo@gmail.com',
    firstNameTh: 'อนุชา',
    lastNameTh: 'ธรรมรงค์',
    firstNameEn: 'Anucha',
    lastNameEn: 'Thammarong',
    roles: ['CEO', 'ADMIN'],
    departmentCode: 'EXEC',
    positionName: 'Chief Executive Officer',
    hireDate: '2018-01-15',
    employmentStatus: 'ACTIVE',
  },
  {
    code: 'ES0002',
    email: 'dev.v001+cto@gmail.com',
    firstNameTh: 'ธนพล',
    lastNameTh: 'ศิริวงศ์',
    firstNameEn: 'Thanapon',
    lastNameEn: 'Siriwong',
    roles: ['CTO', 'ADMIN'],
    departmentCode: 'EXEC',
    positionName: 'Chief Technology Officer',
    hireDate: '2018-03-01',
    employmentStatus: 'ACTIVE',
  },
  {
    code: 'ES0003',
    email: 'dev.v001+coo@gmail.com',
    firstNameTh: 'ปวีณา',
    lastNameTh: 'กุลทรัพย์',
    firstNameEn: 'Paweena',
    lastNameEn: 'Kultsap',
    roles: ['COO'],
    departmentCode: 'EXEC',
    positionName: 'Chief Operating Officer',
    hireDate: '2019-05-20',
    employmentStatus: 'ACTIVE',
  },

  // ─── HR ───
  {
    code: 'ES0004',
    email: 'development.v001@gmail.com', // primary dev account (HRMG)
    firstNameTh: 'อภิณยา',
    lastNameTh: 'สกุลรัตน์',
    firstNameEn: 'Apinya',
    lastNameEn: 'Sakulratn',
    roles: ['HRMG', 'HR_AUTHORIZED'],
    departmentCode: 'HR',
    positionName: 'HR Manager',
    hireDate: '2020-02-10',
    employmentStatus: 'ACTIVE',
  },
  {
    code: 'ES0005',
    email: 'dev.v001+hr@gmail.com',
    firstNameTh: 'วีรยา',
    lastNameTh: 'แสงจันทร์',
    firstNameEn: 'Weeraya',
    lastNameEn: 'Saengchan',
    roles: ['HR_AUTHORIZED'],
    departmentCode: 'HR',
    positionName: 'HR Specialist',
    hireDate: '2022-09-01',
    employmentStatus: 'ACTIVE',
    managerCode: 'ES0004',
  },

  // ─── Managers ───
  {
    code: 'ES0006',
    email: 'dev.v001+mgr.eng@gmail.com',
    firstNameTh: 'สมชาย',
    lastNameTh: 'รวยเหลือ',
    firstNameEn: 'Somchai',
    lastNameEn: 'Ruailuea',
    roles: ['MANAGER'],
    departmentCode: 'ENG',
    positionName: 'Engineering Manager',
    hireDate: '2019-08-12',
    employmentStatus: 'ACTIVE',
    managerCode: 'ES0002', // reports to CTO
  },
  {
    code: 'ES0007',
    email: 'dev.v001+mgr.dsgn@gmail.com',
    firstNameTh: 'นที',
    lastNameTh: 'ภักดี',
    firstNameEn: 'Natee',
    lastNameEn: 'Phakdee',
    roles: ['MANAGER'],
    departmentCode: 'DSGN',
    positionName: 'Design Manager',
    hireDate: '2020-06-01',
    employmentStatus: 'ACTIVE',
    managerCode: 'ES0003',
  },
  {
    code: 'ES0008',
    email: 'dev.v001+mgr.mkt@gmail.com',
    firstNameTh: 'วิภา',
    lastNameTh: 'เจริญสุข',
    firstNameEn: 'Wipa',
    lastNameEn: 'Charoensuk',
    roles: ['MANAGER'],
    departmentCode: 'MKT',
    positionName: 'Marketing Manager',
    hireDate: '2021-04-15',
    employmentStatus: 'ACTIVE',
    managerCode: 'ES0003',
  },
  {
    code: 'ES0009',
    email: 'dev.v001+mgr.fin@gmail.com',
    firstNameTh: 'ดวงใจ',
    lastNameTh: 'พูนสุข',
    firstNameEn: 'Duangjai',
    lastNameEn: 'Poonsuk',
    roles: ['MANAGER'],
    departmentCode: 'FIN',
    positionName: 'Finance Manager',
    hireDate: '2020-11-20',
    employmentStatus: 'ACTIVE',
    managerCode: 'ES0003',
  },

  // ─── Individual Contributors ───
  {
    code: 'ES0010',
    email: 'dev.v001+emp.ice@gmail.com',
    firstNameTh: 'ณัฐภัทร์',
    lastNameTh: 'หลำนุ้ย',
    firstNameEn: 'Nattapat',
    lastNameEn: 'Lamnui',
    roles: ['EMPLOYEE'],
    departmentCode: 'ENG',
    positionName: 'Junior Developer',
    hireDate: '2025-06-03', // <1 year → no annual quota yet
    probationEndDate: '2025-09-30',
    employmentStatus: 'ACTIVE',
    managerCode: 'ES0006',
  },
  {
    code: 'ES0011',
    email: 'dev.v001+emp.suda@gmail.com',
    firstNameTh: 'สุดา',
    lastNameTh: 'ทองดี',
    firstNameEn: 'Suda',
    lastNameEn: 'Thongdee',
    roles: ['EMPLOYEE'],
    departmentCode: 'ENG',
    positionName: 'Senior Software Engineer',
    hireDate: '2022-03-15',
    employmentStatus: 'ACTIVE',
    managerCode: 'ES0006',
  },
  {
    code: 'ES0012',
    email: 'dev.v001+emp.nat@gmail.com',
    firstNameTh: 'ณัฐพล',
    lastNameTh: 'แก้วเจริญ',
    firstNameEn: 'Nattapol',
    lastNameEn: 'Kaewcharoen',
    roles: ['EMPLOYEE'],
    departmentCode: 'ENG',
    positionName: 'Software Engineer',
    hireDate: '2021-07-01',
    employmentStatus: 'ACTIVE',
    managerCode: 'ES0006',
  },
  {
    code: 'ES0013',
    email: 'dev.v001+emp.malee@gmail.com',
    firstNameTh: 'มาลี',
    lastNameTh: 'สวยงาม',
    firstNameEn: 'Malee',
    lastNameEn: 'Suayngam',
    roles: ['EMPLOYEE'],
    departmentCode: 'DSGN',
    positionName: 'Product Designer',
    hireDate: '2020-11-03',
    employmentStatus: 'ACTIVE',
    managerCode: 'ES0007',
  },
  {
    code: 'ES0014',
    email: 'dev.v001+emp.piya@gmail.com',
    firstNameTh: 'ปิยนุช',
    lastNameTh: 'สีดำ',
    firstNameEn: 'Piyanuch',
    lastNameEn: 'Seedam',
    roles: ['EMPLOYEE'],
    departmentCode: 'MKT',
    positionName: 'Marketing Executive',
    hireDate: '2023-01-10',
    employmentStatus: 'ACTIVE',
    managerCode: 'ES0008',
  },
  {
    code: 'ES0015',
    email: 'dev.v001+emp.anon@gmail.com',
    firstNameTh: 'อานนท์',
    lastNameTh: 'โชคดี',
    firstNameEn: 'Anon',
    lastNameEn: 'Chokdee',
    roles: ['EMPLOYEE'],
    departmentCode: 'ENG',
    positionName: 'Junior Developer',
    hireDate: '2026-02-20',
    probationEndDate: '2026-06-20',
    employmentStatus: 'PROBATION',
    managerCode: 'ES0006',
  },
  {
    code: 'ES0016',
    email: 'dev.v001+emp.preecha@gmail.com',
    firstNameTh: 'ปรีชา',
    lastNameTh: 'ใจดี',
    firstNameEn: 'Preecha',
    lastNameEn: 'Jaidee',
    roles: ['EMPLOYEE'],
    departmentCode: 'FIN',
    positionName: 'Accountant',
    hireDate: '2021-04-19',
    employmentStatus: 'SUSPENDED',
    managerCode: 'ES0009',
  },

  // ─── Test: SUSPENDED block ───
  {
    code: 'ES0099',
    email: 'dev.v001+suspended@gmail.com',
    firstNameTh: 'ณัฐภัทร์',
    lastNameTh: 'หลำนุ้ย',
    firstNameEn: 'Nattapat',
    lastNameEn: 'Lamnui',
    roles: ['EMPLOYEE'],
    departmentCode: 'ENG',
    positionName: 'Junior Developer',
    hireDate: '2024-01-15',
    employmentStatus: 'SUSPENDED',
    managerCode: 'ES0006',
  },
];

export type EmployeeRecord = {
  id: string;
  userId: string;
  code: string;
  hireDate: Date;
  roles: Role[];
  employmentStatus: EmploymentStatus;
};

export async function seedEmployees(
  prisma: PrismaClient,
  org: OrgMap,
): Promise<Map<string, EmployeeRecord>> {
  const result = new Map<string, EmployeeRecord>();

  // Pass 1: create users + employees without managerId
  for (const seed of EMPLOYEES) {
    const departmentId = org.departments.get(seed.departmentCode);
    const positionId = org.positions.get(seed.positionName);
    if (!departmentId || !positionId) {
      throw new Error(
        `Missing dept/position for ${seed.code}: dept=${seed.departmentCode} pos=${seed.positionName}`,
      );
    }

    const user = await prisma.user.upsert({
      where: { email: seed.email },
      create: { email: seed.email, emailVerified: new Date() },
      update: {},
    });

    const employee = await prisma.employee.upsert({
      where: { employeeCode: seed.code },
      create: {
        userId: user.id,
        employeeCode: seed.code,
        firstNameTh: seed.firstNameTh,
        lastNameTh: seed.lastNameTh,
        firstNameEn: seed.firstNameEn,
        lastNameEn: seed.lastNameEn,
        roles: seed.roles,
        departmentId,
        positionId,
        hireDate: new Date(seed.hireDate),
        probationEndDate: seed.probationEndDate
          ? new Date(seed.probationEndDate)
          : null,
        employmentStatus: seed.employmentStatus,
      },
      update: {
        roles: seed.roles,
        departmentId,
        positionId,
        employmentStatus: seed.employmentStatus,
      },
    });

    result.set(seed.code, {
      id: employee.id,
      userId: user.id,
      code: seed.code,
      hireDate: new Date(seed.hireDate),
      roles: seed.roles,
      employmentStatus: seed.employmentStatus,
    });
  }

  // Pass 2: resolve manager tree
  for (const seed of EMPLOYEES) {
    if (!seed.managerCode) continue;
    const self = result.get(seed.code);
    const manager = result.get(seed.managerCode);
    if (!self || !manager) continue;
    await prisma.employee.update({
      where: { id: self.id },
      data: { managerId: manager.id },
    });
  }

  return result;
}
