import { z } from "zod";

export const EmployeeCreateSchema = z.object({
  employeeCode: z.string().min(1).max(20),
  email: z.string().email(),
  firstNameTh: z.string().min(1).max(100),
  lastNameTh: z.string().min(1).max(100),
  firstNameEn: z.string().max(100).optional(),
  lastNameEn: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  roles: z.array(z.enum(["EMPLOYEE", "MANAGER", "HR_AUTHORIZED", "HRMG", "CEO", "CTO", "COO", "ADMIN"])).default(["EMPLOYEE"]),
  departmentId: z.string().optional(),
  positionId: z.string().optional(),
  managerId: z.string().optional(),
  hireDate: z.string().date(),
  workShift: z.enum(["MORNING", "EVENING"]).default("MORNING"),
});

export const EmployeeUpdateSchema = z.object({
  firstNameTh: z.string().min(1).max(100).optional(),
  lastNameTh: z.string().min(1).max(100).optional(),
  firstNameEn: z.string().max(100).optional(),
  lastNameEn: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  roles: z.array(z.enum(["EMPLOYEE", "MANAGER", "HR_AUTHORIZED", "HRMG", "CEO", "CTO", "COO", "ADMIN"])).optional(),
  departmentId: z.string().optional(),
  positionId: z.string().optional(),
  managerId: z.string().optional(),
  employmentStatus: z.enum(["PROBATION", "ACTIVE", "SUSPENDED", "RESIGNED", "TERMINATED"]).optional(),
  workShift: z.enum(["MORNING", "EVENING"]).optional(),
});

export const EmployeeListFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["PROBATION", "ACTIVE", "SUSPENDED", "RESIGNED", "TERMINATED"]).optional(),
  departmentId: z.string().optional(),
  search: z.string().optional(),
});

export type EmployeeCreateInput = z.infer<typeof EmployeeCreateSchema>;
export type EmployeeUpdateInput = z.infer<typeof EmployeeUpdateSchema>;
export type EmployeeListFilters = z.infer<typeof EmployeeListFiltersSchema>;
