-- Phase 4: payroll calc + Empeo Excel export support

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('MONTHLY', 'DAILY', 'INTERN');

-- Convert Employee.employmentType from text to EmploymentType enum.
-- Existing rows are all NULL today (schema-inert text field never populated),
-- so we can drop + recreate the column safely. If any rows are populated
-- on a non-dev branch, this migration drops the value — fine for our case.
ALTER TABLE "Employee" DROP COLUMN "employmentType";
ALTER TABLE "Employee" ADD COLUMN "employmentType" "EmploymentType";

-- Sensitive — gated by SENSITIVE_DATA_ROLES at the API layer.
ALTER TABLE "Employee" ADD COLUMN "baseSalary" DECIMAL(12,2);

-- Link expense claims to a payroll cycle so aggregator queries match
-- the OT/leave pattern. Existing rows stay NULL — backfill happens lazily
-- when the next cycle locks (or via HR-triggered reconcile).
ALTER TABLE "ExpenseClaim" ADD COLUMN "payrollCycleId" TEXT;
ALTER TABLE "ExpenseClaim"
  ADD CONSTRAINT "ExpenseClaim_payrollCycleId_fkey"
  FOREIGN KEY ("payrollCycleId") REFERENCES "PayrollCycle"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "ExpenseClaim_payrollCycleId_idx" ON "ExpenseClaim"("payrollCycleId");
