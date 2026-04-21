# EasySlip HR System — System Design: Attendance & Leave Management

> **Business Logic Lock-in (จาก HR Clarification)**
> 1. Payroll: Empeo → Export CSV (ห้ามคำนวณเงิน)
> 2. Auth: Magic Link (NextAuth) ด้วยอีเมลส่วนตัว
> 3. Scale: 43 → ≤50 users (ไม่ต้อง cache ซับซ้อน)
> 4. Cut-off: วันที่ 25 ของทุกเดือน → lock record ย้อนหลังอัตโนมัติ
> 5. Annual Leave: ไม่ทบปี → reset 0 + export cash-out
> 6. Probation Day 1: SICK 30, PERSONAL 3, LWP; ANNUAL 6 วัน **หลังครบ 1 ปีพอดี** + prorated
> 7. WFH Attendance: GPS log เท่านั้น ไม่ geofence
> 8. Strict RBAC: income/benefit data → HR_AUTHORIZED, CEO, CTO, COO, HRMG เท่านั้น

---

## 1. Prisma Schema

```prisma
// schema.prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions", "relationJoins"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pg_trgm, citext]
}

// ─────────────────────────────────────────────────────────────
// IDENTITY & RBAC
// ─────────────────────────────────────────────────────────────

enum Role {
  EMPLOYEE          // default
  MANAGER           // direct report approver
  HR_AUTHORIZED     // payroll/benefit visible
  HRMG              // HR Manager
  CEO
  CTO
  COO
  ADMIN             // system admin (IT)
}

enum EmploymentStatus {
  PROBATION
  ACTIVE
  SUSPENDED
  RESIGNED
  TERMINATED
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique @db.Citext              // NextAuth magic link
  emailVerified DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  isDisabled    Boolean  @default(false)

  employee      Employee?
  sessions      Session[]
  accounts      Account[]
  auditLogs     AuditLog[] @relation("AuditActor")
  consents      ConsentRecord[]

  @@index([email])
}

// NextAuth v5 models
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Employee {
  id                 String           @id @default(cuid())
  userId             String           @unique
  employeeCode       String           @unique            // e.g. ES0042 (ใช้ใน Empeo CSV)
  firstNameTh        String
  lastNameTh         String
  firstNameEn        String?
  lastNameEn         String?
  phone              String?
  roles              Role[]                              // [EMPLOYEE, MANAGER] รองรับหลายบทบาท
  departmentId       String?
  positionId         String?
  managerId          String?                             // direct report tree
  hireDate           DateTime         @db.Date           // ใช้คำนวณ annual leave eligibility
  probationEndDate   DateTime?        @db.Date
  employmentStatus   EmploymentStatus @default(PROBATION)
  terminationDate    DateTime?        @db.Date

  user               User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  department         Department?      @relation(fields: [departmentId], references: [id])
  position           Position?        @relation(fields: [positionId], references: [id])
  manager            Employee?        @relation("ManagerTree", fields: [managerId], references: [id])
  subordinates       Employee[]       @relation("ManagerTree")

  attendanceRecords  AttendanceRecord[]
  leaveRequests      LeaveRequest[]    @relation("LeaveRequester")
  leaveApprovals     LeaveRequest[]    @relation("LeaveApprover")
  leaveQuotas        LeaveQuota[]
  cashOutRecords     AnnualLeaveCashOut[]

  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt

  @@index([managerId])
  @@index([employmentStatus])
  @@index([hireDate])
}

model Department {
  id        String     @id @default(cuid())
  name      String     @unique
  code      String     @unique
  parentId  String?
  parent    Department? @relation("DeptTree", fields: [parentId], references: [id])
  children  Department[] @relation("DeptTree")
  employees Employee[]
}

model Position {
  id        String     @id @default(cuid())
  name      String     @unique
  level     Int        @default(1)
  employees Employee[]
}

// ─────────────────────────────────────────────────────────────
// ATTENDANCE
// ─────────────────────────────────────────────────────────────

enum ClockType {
  IN
  OUT
}

enum WorkLocation {
  OFFICE
  WFH
  ON_SITE            // client visit
}

model AttendanceRecord {
  id             String        @id @default(cuid())
  employeeId     String
  clockType      ClockType
  clockedAt      DateTime                                 // UTC stored
  workLocation   WorkLocation  @default(OFFICE)
  latitude       Decimal?      @db.Decimal(9, 6)          // GPS log only (ไม่ geofence)
  longitude      Decimal?      @db.Decimal(9, 6)
  gpsAccuracyM   Float?                                   // meters
  deviceId       String?                                  // ua fingerprint
  ipAddress      String?
  note           String?       @db.Text
  isBackfilled   Boolean       @default(false)            // true = HR manual edit
  backfillReason String?
  backfilledBy   String?
  payrollCycleId String?                                  // link หลัง finalize
  createdAt      DateTime      @default(now())

  employee       Employee       @relation(fields: [employeeId], references: [id])
  payrollCycle   PayrollCycle?  @relation(fields: [payrollCycleId], references: [id])

  @@index([employeeId, clockedAt])
  @@index([payrollCycleId])
}

// ─────────────────────────────────────────────────────────────
// LEAVE MANAGEMENT
// ─────────────────────────────────────────────────────────────

enum LeaveType {
  SICK                // ลาป่วย (30/year, Day 1)
  PERSONAL            // ลากิจ (3/year, Day 1)
  ANNUAL              // ลาพักร้อน (6/year หลังครบ 1 ปี, prorated)
  LEAVE_WITHOUT_PAY   // ลาไม่รับค่าจ้าง (Day 1, unlimited)
  MATERNITY           // ลาคลอด (98 วัน ตาม ม.41)
  STERILIZATION       // ลาทำหมัน (ตามแพทย์ระบุ)
  ORDINATION          // ลาอุปสมบท
  MILITARY            // ลารับราชการทหาร
  FUNERAL             // ลางานศพ (policy ภายใน)
}

enum LeaveStatus {
  DRAFT
  PENDING              // รออนุมัติ
  APPROVED
  REJECTED
  CANCELLED
  WITHDRAWN            // user ถอนก่อนอนุมัติ
}

enum LeaveHalfDay {
  FULL
  MORNING
  AFTERNOON
}

model LeaveRequest {
  id             String        @id @default(cuid())
  employeeId     String
  leaveType      LeaveType
  startDate      DateTime      @db.Date
  endDate        DateTime      @db.Date
  halfDay        LeaveHalfDay  @default(FULL)
  daysRequested  Decimal       @db.Decimal(4, 2)          // 0.5 / 1 / N
  reason         String        @db.Text
  attachmentUrl  String?                                  // medical cert etc
  status         LeaveStatus   @default(PENDING)
  approverId     String?
  approvedAt     DateTime?
  rejectedReason String?
  payrollCycleId String?
  quotaLockedId  String?                                  // which quota record was debited
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  employee       Employee       @relation("LeaveRequester", fields: [employeeId], references: [id])
  approver       Employee?      @relation("LeaveApprover", fields: [approverId], references: [id])
  payrollCycle   PayrollCycle?  @relation(fields: [payrollCycleId], references: [id])
  quotaLock      LeaveQuota?    @relation("QuotaDebit", fields: [quotaLockedId], references: [id])

  @@index([employeeId, status])
  @@index([startDate, endDate])
  @@index([approverId, status])
  @@index([payrollCycleId])
}

model LeaveQuota {
  id               String     @id @default(cuid())
  employeeId       String
  leaveType        LeaveType
  quotaYear        Int                                    // 2026
  eligibleFrom     DateTime   @db.Date                    // วันที่สิทธิ์เริ่ม (hireDate+1y สำหรับ ANNUAL)
  allocatedDays    Decimal    @db.Decimal(5, 2)           // จำนวนที่ได้ (prorated แล้ว)
  usedDays         Decimal    @db.Decimal(5, 2) @default(0)
  pendingDays      Decimal    @db.Decimal(5, 2) @default(0) // reserved on PENDING request
  isProrated       Boolean    @default(false)
  prorateBasis     String?                                // "hireDate+1y=2026-04-15; 261/365"
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt

  employee         Employee       @relation(fields: [employeeId], references: [id])
  debitedRequests  LeaveRequest[] @relation("QuotaDebit")

  @@unique([employeeId, leaveType, quotaYear])             // 1 quota record per type per year
  @@index([quotaYear])
}

// ── NO carry-over in schema. Year-end unused ANNUAL → cash-out table.
model AnnualLeaveCashOut {
  id              String    @id @default(cuid())
  employeeId      String
  year            Int                                      // ปีที่ต้องจ่ายคืนเป็นเงิน
  unusedDays      Decimal   @db.Decimal(5, 2)
  exportStatus    ExportStatus @default(PENDING)
  exportedAt      DateTime?
  empeoBatchId    String?                                  // Empeo CSV batch ref
  computedAt      DateTime  @default(now())

  employee        Employee  @relation(fields: [employeeId], references: [id])

  @@unique([employeeId, year])
  @@index([exportStatus])
}

enum ExportStatus {
  PENDING
  EXPORTED
  FAILED
}

// ─────────────────────────────────────────────────────────────
// PAYROLL CUT-OFF (Empeo Integration — Event-only)
// ─────────────────────────────────────────────────────────────

enum PayrollCycleStatus {
  OPEN               // อยู่ในรอบ, edit ได้
  LOCKED             // cut-off แล้ว, edit ต้อง HR override + audit
  EXPORTED           // ส่งเข้า Empeo แล้ว
}

model PayrollCycle {
  id              String             @id @default(cuid())
  year            Int
  month           Int                                        // 1-12
  cycleStart      DateTime           @db.Date                // prev month 26
  cycleEnd        DateTime           @db.Date                // this month 25
  cutOffAt        DateTime                                   // 25 23:59:59 TH
  status          PayrollCycleStatus @default(OPEN)
  lockedAt        DateTime?
  lockedBy        String?
  exportedAt      DateTime?
  exportFileUrl   String?                                    // S3/R2 link ของ CSV

  attendance      AttendanceRecord[]
  leaves          LeaveRequest[]
  outboxEvents    PayrollOutboxEvent[]

  @@unique([year, month])
  @@index([status])
}

// Outbox pattern — HR system ส่ง event ให้ Payroll consume
model PayrollOutboxEvent {
  id              String   @id @default(cuid())
  payrollCycleId  String
  eventType       String                                     // "leave.approved" | "attendance.finalized" | "annual_leave.cashout"
  aggregateId     String                                     // employeeId or requestId
  payload         Json                                       // signed JSON
  idempotencyKey  String   @unique
  status          String   @default("PENDING")                // PENDING | CONSUMED | FAILED
  attempts        Int      @default(0)
  lastError       String?  @db.Text
  createdAt       DateTime @default(now())
  consumedAt      DateTime?

  payrollCycle    PayrollCycle @relation(fields: [payrollCycleId], references: [id])

  @@index([status, createdAt])
  @@index([payrollCycleId])
}

// ─────────────────────────────────────────────────────────────
// PDPA & AUDIT
// ─────────────────────────────────────────────────────────────

model AuditLog {
  id           String   @id @default(cuid())
  actorId      String?                                     // null = system
  action       String                                       // "leave.approve" | "attendance.backfill"
  entityType   String                                       // "LeaveRequest"
  entityId     String
  before       Json?
  after        Json?
  ipAddress    String?
  userAgent    String?  @db.Text
  reason       String?  @db.Text                            // required for sensitive action
  createdAt    DateTime @default(now())

  actor        User?    @relation("AuditActor", fields: [actorId], references: [id])

  @@index([entityType, entityId])
  @@index([actorId, createdAt])
  @@index([createdAt])
}

model ConsentRecord {
  id           String    @id @default(cuid())
  userId       String
  purpose      String                                        // "PDPA-EmployeeData-v1"
  version      String                                        // "1.0.0"
  granted      Boolean
  grantedAt    DateTime?
  withdrawnAt  DateTime?
  ipAddress    String?
  userAgent    String?   @db.Text

  user         User      @relation(fields: [userId], references: [id])

  @@index([userId, purpose])
}
```

### Schema Design Notes
- **RBAC** → `Employee.roles Role[]` (array) ใช้ร่วมกับ Next.js middleware + API guard
- **Income/Benefit data** → เก็บที่ table อื่น (out of this feature's scope) แต่ query ต้อง check `roles.hasAny([HR_AUTHORIZED, CEO, CTO, COO, HRMG])`
- **No carry-over** → ไม่มี column `carryOverDays` ใน schema เลย — unused days เข้า `AnnualLeaveCashOut` ตอนสิ้นปี
- **Cut-off lock** → `PayrollCycle.status` + FK จาก attendance/leave → cycle. API middleware reject การ mutate ถ้า cycle LOCKED (ยกเว้น HR override + audit log mandatory)
- **Decimal(5,2)** for days → รองรับลาครึ่งวัน (0.5) และ prorated (4.29)
- **Citext email** → case-insensitive lookup สำหรับ magic link

---

## 2. API Endpoint Strategy (Bun + REST)

> Base path: `/api/v1` — API-first, resource-oriented, stateless

### 2.1 Auth (Passwordless)

| Method | Path | Purpose | Guard |
|---|---|---|---|
| POST | `/auth/magic-link` | ขอ magic link ส่งอีเมล | public, rate-limited 3/min |
| GET | `/auth/callback` | verify token → issue session | public |
| POST | `/auth/signout` | clear session | authenticated |
| GET | `/auth/session` | get current session | authenticated |

### 2.2 Attendance

| Method | Path | Purpose | Guard |
|---|---|---|---|
| POST | `/attendance/clock` | clock-in/out (body: type, lat, lng, accuracy, location, note) | EMPLOYEE (self) |
| GET | `/attendance/me` | ดูของตัวเอง (query: from, to) | EMPLOYEE |
| GET | `/attendance/team` | ทีม (query: date, departmentId) | MANAGER (direct reports only) |
| GET | `/attendance/:employeeId` | ดูของพนักงานคนอื่น | HRMG, HR_AUTHORIZED |
| PATCH | `/attendance/:recordId` | backfill/correct (body: reason mandatory) | HRMG; block if cycle LOCKED |
| POST | `/attendance/finalize-cycle` | finalize ก่อน cut-off | HRMG |

### 2.3 Leave — Employee

| Method | Path | Purpose | Guard |
|---|---|---|---|
| POST | `/leave/requests` | สร้าง leave request | EMPLOYEE |
| GET | `/leave/requests/me` | ของตัวเอง | EMPLOYEE |
| GET | `/leave/requests/:id` | detail | owner / approver / HR |
| PATCH | `/leave/requests/:id/withdraw` | ถอนก่อน approve | owner |
| GET | `/leave/quota/me` | balance ทุกประเภท (current year) | EMPLOYEE |
| POST | `/leave/preview` | pre-check (body: type, start, end) → คำนวณ days + validate quota | EMPLOYEE |

### 2.4 Leave — Manager

| Method | Path | Purpose | Guard |
|---|---|---|---|
| GET | `/leave/approvals/pending` | queue รอ approve (ทีมตัวเอง) | MANAGER |
| POST | `/leave/requests/:id/approve` | อนุมัติ | approver only |
| POST | `/leave/requests/:id/reject` | ปฏิเสธ (body: reason) | approver only |
| POST | `/leave/approvals/bulk` | bulk approve/reject (body: ids[], decision) | MANAGER |
| GET | `/leave/team/calendar` | ปฏิทินทีม | MANAGER |

### 2.5 Leave — HR Admin

| Method | Path | Purpose | Guard |
|---|---|---|---|
| POST | `/hr/quota/reset` | cron endpoint — reset 1 ม.ค. | ADMIN, cron-signed |
| POST | `/hr/quota/grant-anniversary` | cron — grant annual ตาม anniversary | ADMIN, cron-signed |
| POST | `/hr/quota/adjust` | manual adjust (audit mandatory) | HRMG |
| GET | `/hr/quota/:employeeId` | ดู quota ของใคร | HR_AUTHORIZED, HRMG |
| GET | `/hr/leave/report` | รายงาน (query: year, type, dept) | HRMG |

### 2.6 Payroll Cut-off & Empeo Export

| Method | Path | Purpose | Guard |
|---|---|---|---|
| GET | `/payroll/cycles` | list cycles | HRMG |
| POST | `/payroll/cycles/:id/lock` | ปิดรอบ (cut-off) | HRMG, CEO override |
| POST | `/payroll/cycles/:id/export` | generate Empeo CSV | HR_AUTHORIZED |
| GET | `/payroll/cycles/:id/export/download` | download CSV | HR_AUTHORIZED |
| POST | `/payroll/cashout/:year/export` | export annual leave cashout CSV | HR_AUTHORIZED |

### 2.7 Audit & Consent

| Method | Path | Purpose | Guard |
|---|---|---|---|
| GET | `/audit/logs` | query (filter: entity, actor, dateRange) | HRMG, ADMIN |
| GET | `/audit/logs/:entityType/:entityId` | timeline ของ record | HRMG, owner |
| POST | `/consent/grant` | ยอมรับ PDPA consent | authenticated |
| POST | `/consent/withdraw` | ถอน consent | owner |

### 2.8 Internal / System

| Method | Path | Purpose | Guard |
|---|---|---|---|
| POST | `/_system/outbox/retry/:eventId` | retry failed event | ADMIN |
| POST | `/_system/cron/daily-quota` | daily cron tick | cron-signed |
| POST | `/_system/cron/cutoff-lock` | auto-lock cycle 25 เวลา 23:59 | cron-signed |

### API Design Rules
- ทุก mutation → produce `AuditLog` entry (via Prisma middleware หรือ service layer)
- ทุก response ของ income/benefit field → ต้องผ่าน `requireRoles([HR_AUTHORIZED, CEO, CTO, COO, HRMG])` guard; fail → 403 + audit "access.denied"
- Cut-off lock: middleware `assertCycleOpen(date)` ก่อนทุก write
- Idempotency: POST ที่สร้าง outbox event ต้องรับ `Idempotency-Key` header

---

## 3. Leave Quota Engine Logic

### 3.1 Quota State Machine

```
┌─────────────┐
│ allocated   │  ← จำนวนรวมที่ได้รับ (prorated แล้ว)
│ used        │  ← APPROVED แล้ว
│ pending     │  ← อยู่ใน PENDING (reserved)
└─────────────┘
available = allocated - used - pending
```

**Rule**: `available ≥ daysRequested` จึงจะ submit ได้ (validation ทั้ง client + server)

### 3.2 Quota Grant Rules (ตาม Business Logic)

| Leave Type | Day 1 (Hire Date) | หลังครบ 1 ปี | Reset ปีถัดไป |
|---|---|---|---|
| SICK | 30 | 30 | 30 (1 ม.ค.) |
| PERSONAL | 3 | 3 | 3 (1 ม.ค.) |
| LEAVE_WITHOUT_PAY | unlimited | unlimited | — |
| ANNUAL | **0** | **6 prorated จาก anniversary date** | 6 (1 ม.ค.) |
| MATERNITY | 98 (per event) | 98 | reset per pregnancy event |
| ORDINATION | per policy | per policy | per event |
| STERILIZATION | per doctor cert | per doctor cert | per event |
| MILITARY | per call-up | per call-up | per event |

### 3.3 Annual Leave Prorate Algorithm (Core Logic)

**Trigger**: cron daily (`/_system/cron/daily-quota`) + manual endpoint

**Input**: `employee.hireDate`, `today`

**Pseudocode:**

```typescript
// lib/leave/annual-quota-engine.ts

import { Decimal } from '@prisma/client/runtime/library';
import { differenceInCalendarDays, addYears, endOfYear, startOfYear, isSameDay, isAfter } from 'date-fns';

const ANNUAL_LEAVE_FULL_YEAR_DAYS = 6;
const ROUNDING = 'FLOOR_HALF'; // 0.5 step, round down — company policy

type GrantResult =
  | { action: 'NONE'; reason: string }
  | { action: 'GRANT_PRORATED'; days: Decimal; eligibleFrom: Date; basis: string }
  | { action: 'GRANT_FULL'; days: Decimal; eligibleFrom: Date };

export function computeAnnualLeaveGrant(
  hireDate: Date,
  today: Date,
  existingQuota: LeaveQuota | null,
): GrantResult {
  const anniversary = addYears(hireDate, 1);            // วันครบ 1 ปี
  const currentYear = today.getFullYear();
  const yearEnd = endOfYear(today);                      // 31 ธ.ค. ปีนี้
  const yearStart = startOfYear(today);                  // 1 ม.ค. ปีนี้

  // CASE A: ยังไม่ครบ 1 ปี → ไม่มีสิทธิ์
  if (isAfter(anniversary, today)) {
    return { action: 'NONE', reason: 'Not yet completed 1 year of service' };
  }

  // CASE B: ครบ 1 ปีพอดีวันนี้ และยังไม่เคย grant ปีนี้ → prorate
  //        (เช็คจาก anniversary อยู่ในปีนี้ + ยังไม่มี quota record ปี currentYear)
  const anniversaryIsThisYear = anniversary.getFullYear() === currentYear;

  if (anniversaryIsThisYear && !existingQuota) {
    // Days remaining from anniversary to year-end (inclusive)
    const daysRemaining = differenceInCalendarDays(yearEnd, anniversary) + 1;
    const daysInYear = 365;                              // ใช้ 365 เพื่อความคงที่; ไม่ใช่ leap

    const rawDays = (ANNUAL_LEAVE_FULL_YEAR_DAYS * daysRemaining) / daysInYear;
    const proratedDays = roundDown(rawDays, 0.5);        // → Decimal(5,2)

    return {
      action: 'GRANT_PRORATED',
      days: new Decimal(proratedDays.toFixed(2)),
      eligibleFrom: anniversary,
      basis: `anniversary=${anniversary.toISOString().slice(0, 10)}; ` +
             `daysRemaining=${daysRemaining}/${daysInYear}; raw=${rawDays.toFixed(4)}`,
    };
  }

  // CASE C: ปีที่ 2+ (ครบ 1 ปีมาแล้ว) + วันที่ 1 ม.ค. → full grant
  if (isSameDay(today, yearStart) && !existingQuota) {
    return {
      action: 'GRANT_FULL',
      days: new Decimal(ANNUAL_LEAVE_FULL_YEAR_DAYS),
      eligibleFrom: yearStart,
    };
  }

  // CASE D: มี quota ปีนี้แล้ว → skip
  return { action: 'NONE', reason: 'Quota already granted for this year' };
}

function roundDown(value: number, step: number): number {
  return Math.floor(value / step) * step;
}
```

### 3.4 Worked Example

**Employee A**: `hireDate = 2025-04-15`

| วันที่ประเมิน | Anniversary | สถานะ | Quota ที่ grant |
|---|---|---|---|
| 2025-04-15 (Day 1) | 2026-04-15 | ยังไม่ครบปี | SICK 30, PERSONAL 3, LWP ∞, **ANNUAL 0** |
| 2026-04-15 (ครบ 1 ปีพอดี) | — | prorate | daysRemaining = 261 (Apr 15 → Dec 31), raw = 6×261/365 = 4.2904 → **4.00 วัน** (round down 0.5) |
| 2027-01-01 | — | full grant | **ANNUAL 6.00** |
| 2027-12-31 | — | unused | เหลือ 2 วัน → สร้าง `AnnualLeaveCashOut{year:2027, unusedDays:2}`, quota reset |

### 3.5 Year-End Reset Algorithm (No Carry-over)

Cron trigger: `2026-12-31 23:59:59 TH` และ `2027-01-01 00:00:00 TH`

```typescript
// lib/leave/year-end-reset.ts

export async function runYearEndReset(year: number, tx: PrismaTx) {
  const employees = await tx.employee.findMany({
    where: { employmentStatus: { in: ['ACTIVE', 'PROBATION'] } },
  });

  for (const emp of employees) {
    const quota = await tx.leaveQuota.findUnique({
      where: {
        employeeId_leaveType_quotaYear: {
          employeeId: emp.id, leaveType: 'ANNUAL', quotaYear: year,
        },
      },
    });
    if (!quota) continue;

    const unused = quota.allocatedDays
      .minus(quota.usedDays)
      .minus(quota.pendingDays);

    // 1. Emit cash-out record (exportable to Empeo)
    if (unused.gt(0)) {
      await tx.annualLeaveCashOut.upsert({
        where: { employeeId_year: { employeeId: emp.id, year } },
        create: { employeeId: emp.id, year, unusedDays: unused },
        update: { unusedDays: unused },
      });

      // 2. Emit outbox event → Empeo consumer
      await tx.payrollOutboxEvent.create({
        data: {
          payrollCycleId: resolveDecemberCycleId(year),
          eventType: 'annual_leave.cashout',
          aggregateId: emp.id,
          payload: { employeeId: emp.id, year, unusedDays: unused.toString() },
          idempotencyKey: `cashout:${emp.id}:${year}`,
        },
      });
    }

    // 3. Audit log
    await tx.auditLog.create({
      data: {
        actorId: null, // system
        action: 'leave.year_end_reset',
        entityType: 'LeaveQuota',
        entityId: quota.id,
        before: quota as any,
        after: null,
        reason: `Year-end reset ${year}. No carry-over policy.`,
      },
    });
  }

  // 4. ไม่ลบ quota เก่า (เก็บเป็น historical) — แค่ไม่ grant ปีใหม่จน 1 ม.ค.
}
```

### 3.6 Leave Request Debit Flow (Atomic Transaction)

```typescript
// lib/leave/submit-request.ts
export async function submitLeaveRequest(input: SubmitInput, actorId: string) {
  return prisma.$transaction(async (tx) => {
    // 1. Assert cycle open
    await assertCycleOpen(tx, input.startDate);

    // 2. Calculate days (ข้าม weekend + public holiday ตาม config)
    const days = await calculateWorkingDays(tx, input.startDate, input.endDate, input.halfDay);

    // 3. Lock quota row (SELECT FOR UPDATE)
    const quota = await tx.$queryRaw<LeaveQuota[]>`
      SELECT * FROM "LeaveQuota"
      WHERE "employeeId" = ${input.employeeId}
        AND "leaveType" = ${input.leaveType}::"LeaveType"
        AND "quotaYear" = ${input.startDate.getFullYear()}
      FOR UPDATE
    `;
    if (quota.length === 0 && input.leaveType !== 'LEAVE_WITHOUT_PAY') {
      throw new DomainError('NO_QUOTA_RECORD');
    }

    // 4. Check available
    if (quota[0]) {
      const available = quota[0].allocatedDays
        .minus(quota[0].usedDays)
        .minus(quota[0].pendingDays);
      if (available.lt(days)) {
        throw new DomainError('INSUFFICIENT_QUOTA', { available, requested: days });
      }
      // Reserve as pending
      await tx.leaveQuota.update({
        where: { id: quota[0].id },
        data: { pendingDays: { increment: days } },
      });
    }

    // 5. Create request
    const request = await tx.leaveRequest.create({
      data: {
        employeeId: input.employeeId,
        leaveType: input.leaveType,
        startDate: input.startDate,
        endDate: input.endDate,
        halfDay: input.halfDay,
        daysRequested: days,
        reason: input.reason,
        attachmentUrl: input.attachmentUrl,
        status: 'PENDING',
        approverId: await resolveApproverId(tx, input.employeeId),
        quotaLockedId: quota[0]?.id,
      },
    });

    // 6. Audit + Notify (outside tx for notify, fire-and-forget queue)
    await tx.auditLog.create({
      data: {
        actorId, action: 'leave.submit', entityType: 'LeaveRequest',
        entityId: request.id, after: request as any,
      },
    });
    return request;
  }, { isolationLevel: 'Serializable' });
}
```

### 3.7 Guardrails & Edge Cases

| Edge Case | Handling |
|---|---|
| ลา SICK เกิน 30 วัน/ปี | ส่วนเกิน auto-convert → LEAVE_WITHOUT_PAY (ต้อง confirm HR) |
| ลาคลอดคาบปี | allocate ตามปีที่ startDate อยู่, ไม่ prorate |
| ลาย้อนหลังหลัง cut-off | block โดย `assertCycleOpen`; HR override ผ่าน `/attendance/:id` + reason |
| ลาข้าม anniversary (เช่น ลา 10-20 เม.ย. ตอนที่ anniversary = 15 เม.ย.) | ในช่วงก่อน 15 → unavailable; แยก request 2 ใบ หรือ block |
| พนักงานลาออกก่อนใช้ annual | trigger `AnnualLeaveCashOut` ที่ `terminationDate` (prorate ถึงวันออก) |
| Quota ถูก adjust manual (HR เพิ่มพิเศษ) | `allocatedDays` เพิ่มตรงได้ + audit log + `prorateBasis = 'manual-adjust'` |
| Concurrent requests ชน quota | Serializable tx + row lock — งาน 50 คนไม่เป็นปัญหา |

---

## 4. ⚠️ จุดที่ยังต้อง Clarify (ห้ามเดาแทน)

| # | ประเด็น | Impact |
|---|---|---|
| 1 | **Empeo CSV format spec** (column order, encoding, delimiter, leave type code mapping) | Payroll export จะ dev ไม่ได้ถ้าไม่มี spec |
| 2 | **Rounding policy** สำหรับ prorate — ปัดลง 0.5 หรือ 0.25 หรือ 1.0? (ตัวอย่างใช้ 0.5 ปัดลง) | กระทบสิทธิ์พนักงาน |
| 3 | **ลา SICK เกิน 30 วัน** — auto-convert เป็น LWP หรือต้อง manual? | flow ต่างกันมาก |
| 4 | **Public holiday source** — ตั้งเองโดย HR หรือ sync จาก API ภายนอก? | กระทบ `calculateWorkingDays` |
| 5 | **Resigned employee prorate** — คืนเงินตามสัดส่วนที่ทำงานจริงในปีนั้น หรือ flat? | ตัวอย่าง: hire 2025-04-15, resign 2027-06-30 → prorate annual 2027 ยังไง? |
| 6 | **Cut-off override** — ใครมีสิทธิ์ override? CEO เท่านั้น หรือ HRMG ก็ได้? | RBAC rule |
| 7 | **MATERNITY 98 วัน** — จ่ายบริษัท 45 วันแรก ส่วนที่เหลือประกันสังคม — ระบบต้อง flag แยกไหม? | Payroll boundary — น่าจะอยู่ฝั่ง Empeo |
| 8 | **Leave ครึ่งวัน** — กำหนดช่วงเวลาเช้า/บ่ายตายตัว (9-13 / 13-18) หรือ configurable? | UX + working days calc |

---

## 5. Next Steps

**DO**
- Clarify ข้อ 1-8 ข้างต้นกับ HR ก่อน generate migration
- เริ่ม scaffold Prisma schema + migrate แรกไปก่อน (core tables)
- เขียน unit test สำหรับ `computeAnnualLeaveGrant` ด้วย test cases ของ worked example
- Set up cron (`@vercel/cron` หรือ pg_cron) สำหรับ daily quota tick

**DON'T**
- อย่า implement Empeo export ก่อน format spec มา — waste effort
- อย่า hardcode rounding step ใน logic — ทำเป็น config ใน `app_config` table
- อย่ารวม salary/income field ใน table ใน scope นี้ — แยก feature + แยก table
- อย่าปล่อยให้ pending quota leak (ถ้า request ถูก REJECTED/WITHDRAWN ต้อง decrement pending)
