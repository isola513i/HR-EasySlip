-- Phase 3 Sprint 3: Empeo inbound + Expense + Geofence override

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('TRAVEL', 'MEAL', 'EQUIPMENT', 'TRAINING', 'CLIENT', 'OTHER');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GeofenceOverrideStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "EmpeoInboundEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "externalId" TEXT,
    "payload" JSONB NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedAt" TIMESTAMP(3),
    "lastError" TEXT,

    CONSTRAINT "EmpeoInboundEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmpeoInboundEvent_idempotencyKey_key" ON "EmpeoInboundEvent"("idempotencyKey");
CREATE INDEX "EmpeoInboundEvent_status_receivedAt_idx" ON "EmpeoInboundEvent"("status", "receivedAt");
CREATE INDEX "EmpeoInboundEvent_eventType_idx" ON "EmpeoInboundEvent"("eventType");

-- CreateTable
CREATE TABLE "ExpenseClaim" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "amountTHB" DECIMAL(12,2) NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "occurredOn" TIMESTAMP(3) NOT NULL,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'PENDING',
    "approverId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectReason" TEXT,
    "receiptDocumentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExpenseClaim_employeeId_status_idx" ON "ExpenseClaim"("employeeId", "status");
CREATE INDEX "ExpenseClaim_status_createdAt_idx" ON "ExpenseClaim"("status", "createdAt");
CREATE INDEX "ExpenseClaim_approverId_idx" ON "ExpenseClaim"("approverId");

-- AddForeignKey
ALTER TABLE "ExpenseClaim" ADD CONSTRAINT "ExpenseClaim_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExpenseClaim" ADD CONSTRAINT "ExpenseClaim_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExpenseClaim" ADD CONSTRAINT "ExpenseClaim_receiptDocumentId_fkey" FOREIGN KEY ("receiptDocumentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "GeofenceOverrideRequest" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "attendanceRecordId" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "distanceMeters" INTEGER,
    "status" "GeofenceOverrideStatus" NOT NULL DEFAULT 'PENDING',
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decisionNote" TEXT,

    CONSTRAINT "GeofenceOverrideRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GeofenceOverrideRequest_attendanceRecordId_key" ON "GeofenceOverrideRequest"("attendanceRecordId");
CREATE INDEX "GeofenceOverrideRequest_status_requestedAt_idx" ON "GeofenceOverrideRequest"("status", "requestedAt");
CREATE INDEX "GeofenceOverrideRequest_employeeId_status_idx" ON "GeofenceOverrideRequest"("employeeId", "status");

-- AddForeignKey
ALTER TABLE "GeofenceOverrideRequest" ADD CONSTRAINT "GeofenceOverrideRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GeofenceOverrideRequest" ADD CONSTRAINT "GeofenceOverrideRequest_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GeofenceOverrideRequest" ADD CONSTRAINT "GeofenceOverrideRequest_attendanceRecordId_fkey" FOREIGN KEY ("attendanceRecordId") REFERENCES "AttendanceRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;
