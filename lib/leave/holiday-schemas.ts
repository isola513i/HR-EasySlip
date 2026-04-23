import { z } from "zod";

export const HolidayCreateSchema = z.object({
  date: z.string().date(),
  name: z.string().min(1).max(200),
  nameEn: z.string().max(200).optional(),
  isSubstituted: z.boolean().default(false),
});

export const HolidayUpdateSchema = z.object({
  date: z.string().date().optional(),
  name: z.string().min(1).max(200).optional(),
  nameEn: z.string().max(200).optional(),
  isSubstituted: z.boolean().optional(),
});

export type HolidayCreateInput = z.infer<typeof HolidayCreateSchema>;
export type HolidayUpdateInput = z.infer<typeof HolidayUpdateSchema>;
