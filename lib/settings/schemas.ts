import { z } from "zod";

const SettingValue = z.union([z.string(), z.number(), z.boolean()]);

export const SettingUpdateSchema = z.object({
  key: z.string().min(1),
  value: SettingValue,
});

export const SettingBatchUpdateSchema = z.object({
  updates: z
    .array(z.object({ key: z.string().min(1), value: SettingValue }))
    .min(1)
    .max(50),
});

export const SettingResetSchema = z.object({
  key: z.string().min(1),
});

export type SettingUpdateInput = z.infer<typeof SettingUpdateSchema>;
export type SettingBatchUpdateInput = z.infer<typeof SettingBatchUpdateSchema>;
export type SettingResetInput = z.infer<typeof SettingResetSchema>;
