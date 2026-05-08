import { z } from "zod";
import { ExpenseCategory, ExpenseStatus } from "@prisma/client";

export const ExpenseCreateSchema = z.object({
  amountTHB: z.number().positive().max(1_000_000),
  category: z.nativeEnum(ExpenseCategory),
  description: z.string().min(5).max(2000),
  occurredOn: z.string().date(),
  receiptDocumentId: z.string().min(1).optional(),
});

export const ExpenseDecisionSchema = z
  .object({
    decision: z.enum([ExpenseStatus.APPROVED, ExpenseStatus.REJECTED]),
    rejectReason: z.string().max(500).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.decision === ExpenseStatus.REJECTED && !val.rejectReason?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rejectReason"],
        message: "REJECT_REASON_REQUIRED",
      });
    }
  });

export const ExpenseListFiltersSchema = z.object({
  status: z.nativeEnum(ExpenseStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export type ExpenseCreateInput = z.infer<typeof ExpenseCreateSchema>;
export type ExpenseDecisionInput = z.infer<typeof ExpenseDecisionSchema>;
export type ExpenseListFilters = z.infer<typeof ExpenseListFiltersSchema>;
