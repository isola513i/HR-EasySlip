export interface ApprovalRow {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  halfDay: "FULL" | "MORNING" | "AFTERNOON";
  daysRequested: string; // Decimal serialized as string
  reason: string;
  status: string;
  attachmentUrl: string | null;
  createdAt: string;
  employee: {
    firstNameTh: string;
    lastNameTh: string;
    employeeCode: string;
  };
}
