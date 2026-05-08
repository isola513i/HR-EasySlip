// ════════════════════════════════════════════════════════════════
// Domain Error — typed errors with HTTP status for API handlers
// ════════════════════════════════════════════════════════════════

export class DomainError extends Error {
  constructor(
    public readonly code: string,
    public readonly details?: Record<string, unknown>,
    public readonly httpStatus: number = 400,
  ) {
    super(code);
    this.name = "DomainError";
  }
}

// Common error codes (referenced by services)
export const ErrorCodes = {
  CYCLE_LOCKED: "CYCLE_LOCKED",
  INSUFFICIENT_QUOTA: "INSUFFICIENT_QUOTA",
  NO_QUOTA_RECORD: "NO_QUOTA_RECORD",
  ALREADY_PROCESSED: "ALREADY_PROCESSED",
  NOT_OWNER: "NOT_OWNER",
  NOT_APPROVER: "NOT_APPROVER",
  EMPLOYEE_NOT_FOUND: "EMPLOYEE_NOT_FOUND",
  RECORD_NOT_FOUND: "RECORD_NOT_FOUND",
  INVALID_STATUS: "INVALID_STATUS",
  DUPLICATE_CLOCK: "DUPLICATE_CLOCK",
  REJECT_REASON_REQUIRED: "REJECT_REASON_REQUIRED",
  RECEIPT_NOT_OWNED: "RECEIPT_NOT_OWNED",
  GEOFENCE_BLOCKED: "GEOFENCE_BLOCKED",
} as const;
