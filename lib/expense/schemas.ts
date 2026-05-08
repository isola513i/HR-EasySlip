import { z } from "zod";

export const ExpenseCategoryEnum = z.enum([
  "TRAVEL",
  "MEAL",
  "EQUIPMENT",
  "TRAINING",
  "CLIENT",
  "OTHER",
]);

export const ExpenseStatusEnum = z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]);

export const ExpenseCreateSchema = z.object({
  amountTHB: z.number().positive().max(1_000_000),
  category: ExpenseCategoryEnum,
  description: z.string().min(5).max(2000),
  occurredOn: z.string().date(),
  receiptDocumentId: z.string().min(1).optional(),
});

export const ExpenseDecisionSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  rejectReason: z.string().max(500).optional(),
});

export const ExpenseListFiltersSchema = z.object({
  status: ExpenseStatusEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export type ExpenseCreateInput = z.infer<typeof ExpenseCreateSchema>;
export type ExpenseDecisionInput = z.infer<typeof ExpenseDecisionSchema>;
export type ExpenseListFilters = z.infer<typeof ExpenseListFiltersSchema>;
