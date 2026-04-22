// ════════════════════════════════════════════════════════════════
// OpenAPI 3.1 Spec — EasySlip HR System API
// Manually defined to match all implemented endpoints
// ════════════════════════════════════════════════════════════════

const bearerAuth = {
  bearerAuth: { type: "http", scheme: "bearer", description: "NextAuth session cookie" },
  cronSecret: { type: "http", scheme: "bearer", description: "CRON_SECRET shared secret" },
};

const errorResponse = (desc: string) => ({
  description: desc,
  content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
});

const paginatedResponse = (itemRef: string, desc: string) => ({
  description: desc,
  content: { "application/json": { schema: {
    type: "object",
    properties: {
      ok: { type: "boolean", const: true },
      data: { type: "array", items: { $ref: itemRef } },
      pagination: { $ref: "#/components/schemas/Pagination" },
    },
  } } },
});

export function buildOpenApiDocument() {
  return {
    openapi: "3.1.0",
    info: {
      title: "EasySlip HR System API",
      version: "1.0.0",
      description: "Internal HR system — Attendance, Leave Management, Payroll Cut-off & Empeo Integration. ~50 users, Thai labor law 2025 compliant.",
    },
    servers: [{ url: "/api/v1", description: "API v1" }],
    tags: [
      { name: "Attendance", description: "Clock-in/out, records, backfill" },
      { name: "Time Adjustment", description: "Request missing clock times" },
      { name: "Leave - Employee", description: "Submit, view, withdraw leave requests" },
      { name: "Leave - Manager", description: "Approve, reject, team calendar" },
      { name: "Leave - HR Admin", description: "Quota management, reports" },
      { name: "Payroll", description: "Cycle management, Empeo export" },
      { name: "Audit", description: "Audit logs and entity timelines" },
      { name: "Consent", description: "PDPA consent management" },
      { name: "System", description: "Internal cron and outbox management" },
    ],
    paths: {
      // ── Attendance ──
      "/attendance/clock": {
        post: {
          tags: ["Attendance"], summary: "Clock in/out",
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ClockInput" } } } },
          responses: { "201": { description: "Clock record created" }, "401": errorResponse("Unauthorized"), "429": errorResponse("Rate limited") },
        },
      },
      "/attendance/me": {
        get: {
          tags: ["Attendance"], summary: "Get own attendance records",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "from", in: "query", required: true, schema: { type: "string", format: "date" } },
            { name: "to", in: "query", required: true, schema: { type: "string", format: "date" } },
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "perPage", in: "query", schema: { type: "integer", default: 20 } },
          ],
          responses: { "200": paginatedResponse("#/components/schemas/AttendanceRecord", "Paginated attendance records") },
        },
      },
      "/attendance/team": {
        get: {
          tags: ["Attendance"], summary: "Get team attendance (Manager)",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "date", in: "query", required: true, schema: { type: "string", format: "date" } },
            { name: "departmentId", in: "query", schema: { type: "string" } },
          ],
          responses: { "200": { description: "Team attendance records" }, "403": errorResponse("Forbidden") },
        },
      },
      "/attendance/employee/{employeeId}": {
        get: {
          tags: ["Attendance"], summary: "Get employee attendance (HR)",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "employeeId", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": paginatedResponse("#/components/schemas/AttendanceRecord", "Employee records"), "403": errorResponse("Forbidden") },
        },
      },
      "/attendance/records/{recordId}/backfill": {
        patch: {
          tags: ["Attendance"], summary: "Backfill/correct attendance record (HR)",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "recordId", in: "path", required: true, schema: { type: "string" } }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/BackfillInput" } } } },
          responses: { "200": { description: "Record updated" }, "400": errorResponse("Cycle locked") },
        },
      },
      "/attendance/finalize-cycle": {
        post: {
          tags: ["Attendance"], summary: "Finalize payroll cycle (HRMG)",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Cycle locked" }, "400": errorResponse("No open cycle") },
        },
      },

      // ── Time Adjustment ──
      "/attendance/adjustment": {
        post: {
          tags: ["Time Adjustment"], summary: "Submit time adjustment request",
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/TimeAdjSubmit" } } } },
          responses: { "201": { description: "Request created" } },
        },
        get: {
          tags: ["Time Adjustment"], summary: "Get own adjustment requests",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "page", in: "query", schema: { type: "integer" } },
            { name: "status", in: "query", schema: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"] } },
          ],
          responses: { "200": paginatedResponse("#/components/schemas/TimeAdjustmentRequest", "Own requests") },
        },
      },
      "/attendance/adjustment/pending": {
        get: {
          tags: ["Time Adjustment"], summary: "Get pending requests for approval (Manager)",
          security: [{ bearerAuth: [] }],
          responses: { "200": paginatedResponse("#/components/schemas/TimeAdjustmentRequest", "Pending requests") },
        },
      },
      "/attendance/adjustment/{id}": {
        get: { tags: ["Time Adjustment"], summary: "Get adjustment request detail", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Request detail" }, "404": errorResponse("Not found") } },
      },
      "/attendance/adjustment/{id}/withdraw": {
        patch: { tags: ["Time Adjustment"], summary: "Withdraw adjustment request", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Withdrawn" }, "403": errorResponse("Not owner") } },
      },
      "/attendance/adjustment/{id}/approve": {
        post: { tags: ["Time Adjustment"], summary: "Approve → auto-create AttendanceRecord", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Approved + attendance record created" } } },
      },
      "/attendance/adjustment/{id}/reject": {
        post: {
          tags: ["Time Adjustment"], summary: "Reject adjustment request",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { reason: { type: "string" } }, required: ["reason"] } } } },
          responses: { "200": { description: "Rejected" } },
        },
      },

      // ── Leave Employee ──
      "/leave/requests": {
        post: {
          tags: ["Leave - Employee"], summary: "Create leave request",
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/LeaveRequestInput" } } } },
          responses: { "201": { description: "Request created" }, "400": errorResponse("Insufficient quota") },
        },
      },
      "/leave/requests/me": {
        get: { tags: ["Leave - Employee"], summary: "Get own leave requests", security: [{ bearerAuth: [] }], responses: { "200": paginatedResponse("#/components/schemas/LeaveRequest", "Own requests") } },
      },
      "/leave/requests/{id}": {
        get: { tags: ["Leave - Employee"], summary: "Get leave request detail", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Request detail" } } },
      },
      "/leave/requests/{id}/withdraw": {
        patch: { tags: ["Leave - Employee"], summary: "Withdraw leave request (releases pending quota)", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Withdrawn" } } },
      },
      "/leave/quota/me": {
        get: { tags: ["Leave - Employee"], summary: "Get own quota balance (all types)", security: [{ bearerAuth: [] }], parameters: [{ name: "year", in: "query", schema: { type: "integer" } }], responses: { "200": { description: "Quota balances" } } },
      },
      "/leave/preview": {
        post: {
          tags: ["Leave - Employee"], summary: "Preview leave calculation (no side effects)",
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/LeavePreviewInput" } } } },
          responses: { "200": { description: "Preview with days + quota check" } },
        },
      },

      // ── Leave Manager ──
      "/leave/approvals/pending": {
        get: { tags: ["Leave - Manager"], summary: "Get pending approval queue", security: [{ bearerAuth: [] }], responses: { "200": paginatedResponse("#/components/schemas/LeaveRequest", "Pending approvals") } },
      },
      "/leave/requests/{id}/approve": {
        post: { tags: ["Leave - Manager"], summary: "Approve leave (moves pending→used)", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Approved" } } },
      },
      "/leave/requests/{id}/reject": {
        post: {
          tags: ["Leave - Manager"], summary: "Reject leave (releases pending quota)",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { reason: { type: "string" } }, required: ["reason"] } } } },
          responses: { "200": { description: "Rejected" } },
        },
      },
      "/leave/approvals/bulk": {
        post: {
          tags: ["Leave - Manager"], summary: "Bulk approve/reject",
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/BulkDecision" } } } },
          responses: { "200": { description: "Bulk results" } },
        },
      },
      "/leave/team/calendar": {
        get: {
          tags: ["Leave - Manager"], summary: "Team leave calendar",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "month", in: "query", required: true, schema: { type: "integer", minimum: 1, maximum: 12 } },
            { name: "year", in: "query", required: true, schema: { type: "integer" } },
          ],
          responses: { "200": { description: "Team calendar data" } },
        },
      },

      // ── Leave HR Admin ──
      "/hr/quota/reset": { post: { tags: ["Leave - HR Admin"], summary: "Year-end quota reset (cron)", security: [{ cronSecret: [] }], responses: { "200": { description: "Reset result" } } } },
      "/hr/quota/grant-anniversary": { post: { tags: ["Leave - HR Admin"], summary: "Grant anniversary annual leave (cron)", security: [{ cronSecret: [] }], responses: { "200": { description: "Grant result" } } } },
      "/hr/quota/adjust": {
        post: {
          tags: ["Leave - HR Admin"], summary: "Manual quota adjustment (HRMG)",
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/QuotaAdjust" } } } },
          responses: { "200": { description: "Adjusted quota" } },
        },
      },
      "/hr/quota/{employeeId}": {
        get: {
          tags: ["Leave - HR Admin"], summary: "View employee quota (HR)",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "employeeId", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Quota data" } },
        },
      },
      "/hr/leave/report": {
        get: {
          tags: ["Leave - HR Admin"], summary: "Leave report (HRMG)",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "year", in: "query", required: true, schema: { type: "integer" } },
            { name: "leaveType", in: "query", schema: { type: "string" } },
            { name: "departmentId", in: "query", schema: { type: "string" } },
          ],
          responses: { "200": { description: "Report data" } },
        },
      },

      // ── Payroll ──
      "/payroll/cycles": { get: { tags: ["Payroll"], summary: "List payroll cycles", security: [{ bearerAuth: [] }], responses: { "200": { description: "Cycles list" } } } },
      "/payroll/cycles/{id}/lock": { post: { tags: ["Payroll"], summary: "Lock payroll cycle (cut-off)", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Cycle locked" } } } },
      "/payroll/cycles/{id}/export/timestamps": {
        post: { tags: ["Payroll"], summary: "Generate Empeo timestamp CSV", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "CSV file", content: { "text/csv": {} } } } },
        get: { tags: ["Payroll"], summary: "Download Empeo timestamp CSV", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "CSV file download" } } },
      },
      "/payroll/cashout/{year}/export": {
        post: { tags: ["Payroll"], summary: "Export annual leave cashout CSV", security: [{ bearerAuth: [] }], parameters: [{ name: "year", in: "path", required: true, schema: { type: "integer" } }], responses: { "200": { description: "CSV file" } } },
      },

      // ── Audit ──
      "/audit/logs": { get: { tags: ["Audit"], summary: "Query audit logs", security: [{ bearerAuth: [] }], responses: { "200": paginatedResponse("#/components/schemas/AuditLog", "Audit logs") } } },
      "/audit/logs/{entityType}/{entityId}": {
        get: {
          tags: ["Audit"], summary: "Entity audit timeline",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "entityType", in: "path", required: true, schema: { type: "string" } },
            { name: "entityId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: { "200": { description: "Timeline entries" } },
        },
      },

      // ── Consent ──
      "/consent/grant": { post: { tags: ["Consent"], summary: "Grant PDPA consent", security: [{ bearerAuth: [] }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ConsentGrant" } } } }, responses: { "201": { description: "Consent granted" } } } },
      "/consent/withdraw": { post: { tags: ["Consent"], summary: "Withdraw PDPA consent", security: [{ bearerAuth: [] }], responses: { "200": { description: "Consent withdrawn" }, "404": errorResponse("No active consent") } } },

      // ── System ──
      "/system/outbox/retry/{eventId}": { post: { tags: ["System"], summary: "Retry failed outbox event", security: [{ bearerAuth: [] }], parameters: [{ name: "eventId", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Event retried" } } } },
      "/system/cron/daily-quota": { post: { tags: ["System"], summary: "Daily quota tick (cron)", security: [{ cronSecret: [] }], responses: { "200": { description: "Tick result" } } } },
      "/system/cron/cutoff-lock": { post: { tags: ["System"], summary: "Auto-lock cycle on 25th (cron)", security: [{ cronSecret: [] }], responses: { "200": { description: "Lock result" } } } },
    },
    components: {
      securitySchemes: bearerAuth,
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            ok: { type: "boolean", const: false },
            error: { type: "string" },
            code: { type: "string" },
            details: {},
          },
          required: ["ok", "error", "code"],
        },
        Pagination: {
          type: "object",
          properties: {
            total: { type: "integer" },
            page: { type: "integer" },
            perPage: { type: "integer" },
            totalPages: { type: "integer" },
          },
        },
        ClockInput: {
          type: "object",
          properties: {
            clockType: { type: "string", enum: ["IN", "OUT"] },
            workLocation: { type: "string", enum: ["OFFICE", "WFH", "ON_SITE"], default: "OFFICE" },
            latitude: { type: "number" },
            longitude: { type: "number" },
            gpsAccuracyM: { type: "number" },
            note: { type: "string", maxLength: 500 },
          },
          required: ["clockType"],
        },
        BackfillInput: {
          type: "object",
          properties: {
            clockType: { type: "string", enum: ["IN", "OUT"] },
            clockedAt: { type: "string", format: "date-time" },
            workLocation: { type: "string", enum: ["OFFICE", "WFH", "ON_SITE"] },
            reason: { type: "string", minLength: 1, maxLength: 500 },
          },
          required: ["clockType", "clockedAt", "reason"],
        },
        TimeAdjSubmit: {
          type: "object",
          properties: {
            clockType: { type: "string", enum: ["IN", "OUT"] },
            requestedAt: { type: "string", format: "date-time" },
            reason: { type: "string" },
            attachmentUrl: { type: "string", format: "uri" },
          },
          required: ["clockType", "requestedAt", "reason"],
        },
        LeaveRequestInput: {
          type: "object",
          properties: {
            leaveType: { type: "string", enum: ["SICK", "PERSONAL", "ANNUAL", "LEAVE_WITHOUT_PAY", "MATERNITY", "PATERNITY", "CHILD_CARE", "ORDINATION", "MILITARY", "FUNERAL", "TRAINING"] },
            startDate: { type: "string", format: "date" },
            endDate: { type: "string", format: "date" },
            halfDay: { type: "string", enum: ["FULL", "MORNING", "AFTERNOON"], default: "FULL" },
            reason: { type: "string" },
            attachmentUrl: { type: "string", format: "uri" },
          },
          required: ["leaveType", "startDate", "endDate", "reason"],
        },
        LeavePreviewInput: {
          type: "object",
          properties: {
            leaveType: { type: "string" },
            startDate: { type: "string", format: "date" },
            endDate: { type: "string", format: "date" },
            halfDay: { type: "string", enum: ["FULL", "MORNING", "AFTERNOON"] },
          },
          required: ["leaveType", "startDate", "endDate"],
        },
        BulkDecision: {
          type: "object",
          properties: {
            ids: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 50 },
            decision: { type: "string", enum: ["APPROVED", "REJECTED"] },
            reason: { type: "string" },
          },
          required: ["ids", "decision"],
        },
        QuotaAdjust: {
          type: "object",
          properties: {
            employeeId: { type: "string" },
            leaveType: { type: "string" },
            quotaYear: { type: "integer" },
            adjustDays: { type: "number" },
            reason: { type: "string" },
          },
          required: ["employeeId", "leaveType", "quotaYear", "adjustDays", "reason"],
        },
        ConsentGrant: {
          type: "object",
          properties: {
            purpose: { type: "string" },
            version: { type: "string" },
          },
          required: ["purpose", "version"],
        },
        AttendanceRecord: { type: "object", description: "Attendance clock-in/out record" },
        TimeAdjustmentRequest: { type: "object", description: "Time adjustment request" },
        LeaveRequest: { type: "object", description: "Leave request" },
        AuditLog: { type: "object", description: "Audit log entry" },
      },
    },
  };
}
