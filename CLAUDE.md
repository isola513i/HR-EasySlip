# EasySlip Internal HR System — Phase 1 MVP

## 1. Tech Stack (Hard Constraints)
- **Frontend:** Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui (always prioritize)
- **Backend:** Bun (API-first), PostgreSQL via NeonDB, Prisma ORM
- **Mobile:** PWA only, mobile-first UI

## 2. Business Logic
**Payroll (Empeo integration):**
- ✅ Own: OT (hrs × hourly × 1.5/3.0/1.0), LWP/absent/annual-leave-cashout deductions, expense reimbursement passthrough
- ❌ Forbidden: tax, SSO, PVD, net pay, payslip/bank file generation, severance automation
- `Employee.baseSalary` = PDPA-sensitive; gate all R/W behind `isSensitiveDataRole()` + audit log
- Use Outbox pattern for Empeo events

**Auth:** Email+Password (primary), Magic Link (backup) via NextAuth. Auto-generate password on creation; force change on first login.

**Cut-off:** 25th of each month — hard freeze/lock past-cycle records.

**Leave Quotas (Thai Law 2025):**
- No carry-over; annual leave resets to 0 (cash-out)
- Probation Day 1: Sick (30d), Personal (3d), LWP
- Annual Leave: 6d after 1 full year, then prorated

**Attendance:** GPS clock-in/out (Lat/Long recorded, no geofencing enforcement).

**Scale:** ~50 users. No caching over-engineering in Phase 1.

## 3. Security & RBAC
- PDPA "Privacy by Design": ALL sensitive/personal mutations → immutable Audit Log
- Salary/income/benefits visible **only** to: `HR_AUTHORIZED`, `CEO`, `CTO`, `COO`, `HRMG`
- All other roles (including standard managers) → zero access. Zero Trust.

## 4. Code Quality
- **SoC:** No fat controllers. Routes = request/response only. Business logic → Services/Utils. Prisma → dedicated service layer.
- **Frontend:** Dumb UI components. State/data fetching → Custom Hooks or Server Actions.
- **File limit:** 150–200 lines max — proactively split before continuing.
- **DRY:** Extract repeated queries/utils immediately.

## 5. Component Reuse
- Scan `components/ui`, `components/shared`, `lib/` before building anything new.
- Always prefer existing shadcn/ui components over custom builds.
- Extend/generalize existing components via props rather than duplicating.

## 6. i18n (Mandatory)
- **No hardcoded strings.** All user-facing text via dictionary system.
- Files: `lib/i18n/dictionaries/en.ts` + `th.ts` (identical keys, always update both).
- Server components: `const t = getDictionary(await getLocale())`
- Client components: `const t = useT()` from `lib/i18n/locale-context.tsx`
- Covers: labels, placeholders, toasts, errors, empty states, button text.
- API errors → return error codes; frontend maps codes → localized messages.

## 7. Communication
- Direct and technical. No fluff.
- Ambiguity on Thai law, security, or payroll boundaries → **stop and ask** before coding.