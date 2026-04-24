-- OT Module: OvertimeType enum + OvertimeRequest table
CREATE TYPE "OvertimeType" AS ENUM ('WEEKDAY', 'HOLIDAY', 'HOLIDAY_WORK');

CREATE TABLE "OvertimeRequest" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "overtimeType" "OvertimeType" NOT NULL,
    "assignedStart" TIMESTAMP(3),
    "assignedEnd" TIMESTAMP(3),
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "hoursApproved" DECIMAL(4,2),
    "rateMultiplier" DECIMAL(3,1) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "approverId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "payrollCycleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OvertimeRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OvertimeRequest_employeeId_date_idx" ON "OvertimeRequest"("employeeId", "date");
CREATE INDEX "OvertimeRequest_approverId_status_idx" ON "OvertimeRequest"("approverId", "status");

ALTER TABLE "OvertimeRequest" ADD CONSTRAINT "OvertimeRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OvertimeRequest" ADD CONSTRAINT "OvertimeRequest_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OvertimeRequest" ADD CONSTRAINT "OvertimeRequest_payrollCycleId_fkey" FOREIGN KEY ("payrollCycleId") REFERENCES "PayrollCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
