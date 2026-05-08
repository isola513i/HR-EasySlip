-- CreateEnum
CREATE TYPE "SalaryAdjustmentType" AS ENUM ('INITIAL', 'RAISE', 'DEMOTION', 'PROMOTION', 'CORRECTION', 'BONUS_GRANT');

-- CreateTable
CREATE TABLE "SalaryAdjustment" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "effectiveDate" DATE NOT NULL,
    "adjustmentType" "SalaryAdjustmentType" NOT NULL,
    "salaryBefore" DECIMAL(12,2),
    "salaryAfter" DECIMAL(12,2) NOT NULL,
    "ratePct" DECIMAL(6,2),
    "note" TEXT,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalaryAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalaryAdjustment_employeeId_effectiveDate_idx" ON "SalaryAdjustment"("employeeId", "effectiveDate");
CREATE INDEX "SalaryAdjustment_employeeId_adjustmentType_idx" ON "SalaryAdjustment"("employeeId", "adjustmentType");

-- AddForeignKey
ALTER TABLE "SalaryAdjustment"
  ADD CONSTRAINT "SalaryAdjustment_employeeId_fkey"
  FOREIGN KEY ("employeeId") REFERENCES "Employee"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
