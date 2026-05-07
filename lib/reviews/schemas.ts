import { z } from "zod";

export const ReviewQuestionSchema = z.object({
  key: z.string().min(1).max(64),
  label: z.string().min(1).max(300),
  type: z.enum(["scale", "text"]),
  required: z.boolean().default(false),
});

export const ReviewTemplateCreateSchema = z.object({
  name: z.string().min(1).max(120),
  questions: z.array(ReviewQuestionSchema).min(1).max(50),
});

export const ReviewCycleCreateSchema = z.object({
  name: z.string().min(1).max(120),
  cadence: z.enum(["QUARTERLY", "ANNUAL"]),
  startDate: z.string().date(),
  endDate: z.string().date(),
  templateId: z.string().min(1),
});

export const ReviewCycleStatusSchema = z.object({
  status: z.enum(["DRAFT", "ACTIVE", "CLOSED"]),
});

export const ReviewSubmitSchema = z.object({
  answers: z.record(z.string(), z.union([z.string(), z.number()])),
  overallRating: z.number().int().min(1).max(5).optional(),
  comments: z.string().max(5000).optional(),
});

export const ReviewSaveDraftSchema = z.object({
  answers: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
  overallRating: z.number().int().min(1).max(5).optional().nullable(),
  comments: z.string().max(5000).optional().nullable(),
});

export type ReviewQuestion = z.infer<typeof ReviewQuestionSchema>;
export type ReviewTemplateCreateInput = z.infer<typeof ReviewTemplateCreateSchema>;
export type ReviewCycleCreateInput = z.infer<typeof ReviewCycleCreateSchema>;
export type ReviewSubmitInput = z.infer<typeof ReviewSubmitSchema>;
export type ReviewSaveDraftInput = z.infer<typeof ReviewSaveDraftSchema>;
