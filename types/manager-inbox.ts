export interface ManagerEmployee {
  firstNameTh: string;
  lastNameTh: string;
  employeeCode: string;
}

export interface TimeAdjustmentRow {
  id: string;
  clockType: "IN" | "OUT";
  requestedAt: string;
  reason: string;
  hasAttachment: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  employee: ManagerEmployee;
}

export interface OvertimeRow {
  id: string;
  date: string;
  overtimeType: "WEEKDAY" | "HOLIDAY" | "HOLIDAY_WORK";
  assignedStart: string | null;
  assignedEnd: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  hoursApproved: string | null;
  rateMultiplier: string;
  reason: string;
  status: string;
  createdAt: string;
  employee: ManagerEmployee;
}
