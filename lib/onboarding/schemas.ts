import { z } from "zod";
import { ONBOARDING_CATEGORIES } from "./constants";

const TemplateItemSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(ONBOARDING_CATEGORIES).optional(),
  sortOrder: z.coerce.number().int().default(0),
});

export const TemplateCreateSchema = z.object({
  name: z.string().min(1).max(100),
  isDefault: z.boolean().optional(),
  items: z.array(TemplateItemSchema).min(1, "ต้องมีอย่างน้อย 1 รายการ"),
});

export const TemplateUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  items: z.array(TemplateItemSchema).min(1).optional(),
});

export const ChecklistItemToggleSchema = z.object({
  isDone: z.boolean(),
});

export type TemplateCreateInput = z.infer<typeof TemplateCreateSchema>;
export type TemplateUpdateInput = z.infer<typeof TemplateUpdateSchema>;
