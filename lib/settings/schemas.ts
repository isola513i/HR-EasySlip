import { z } from "zod";

export const SettingUpdateSchema = z.object({
  key: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

export type SettingUpdateInput = z.infer<typeof SettingUpdateSchema>;
