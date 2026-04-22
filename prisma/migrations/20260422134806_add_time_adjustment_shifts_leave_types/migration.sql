/*
  Warnings:

  - The values [STERILIZATION] on the enum `LeaveType` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "WorkShift" AS ENUM ('MORNING', 'EVENING');

-- CreateEnum
CREATE TYPE "TimeAdjustmentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
BEGIN;
CREATE TYPE "LeaveType_new" AS ENUM ('SICK', 'PERSONAL', 'ANNUAL', 'LEAVE_WITHOUT_PAY', 'MATERNITY', 'PATERNITY', 'CHILD_CARE', 'ORDINATION', 'MILITARY', 'FUNERAL', 'TRAINING');
ALTER TABLE "LeaveRequest" ALTER COLUMN "leaveType" TYPE "LeaveType_new" USING ("leaveType"::text::"LeaveType_new");
ALTER TABLE "LeaveQuota" ALTER COLUMN "leaveType" TYPE "LeaveType_new" USING ("leaveType"::text::"LeaveType_new");
ALTER TYPE "LeaveType" RENAME TO "LeaveType_old";
ALTER TYPE "LeaveType_new" RENAME TO "LeaveType";
DROP TYPE "public"."LeaveType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "workShift" "WorkShift" NOT NULL DEFAULT 'MORNING';

-- CreateTable
CREATE TABLE "TimeAdjustmentRequest" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "clockType" "ClockType" NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "status" "TimeAdjustmentStatus" NOT NULL DEFAULT 'PENDING',
    "approverId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "attendanceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeAdjustmentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TimeAdjustmentRequest_attendanceId_key" ON "TimeAdjustmentRequest"("attendanceId");

-- CreateIndex
CREATE INDEX "TimeAdjustmentRequest_employeeId_status_idx" ON "TimeAdjustmentRequest"("employeeId", "status");

-- CreateIndex
CREATE INDEX "TimeAdjustmentRequest_approverId_status_idx" ON "TimeAdjustmentRequest"("approverId", "status");

-- CreateIndex
CREATE INDEX "TimeAdjustmentRequest_createdAt_idx" ON "TimeAdjustmentRequest"("createdAt");

-- AddForeignKey
ALTER TABLE "TimeAdjustmentRequest" ADD CONSTRAINT "TimeAdjustmentRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeAdjustmentRequest" ADD CONSTRAINT "TimeAdjustmentRequest_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeAdjustmentRequest" ADD CONSTRAINT "TimeAdjustmentRequest_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "AttendanceRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;
