import { z } from "zod";

export const ProfileUpdateSchema = z.object({
  phone: z.string().max(20).optional(),
  firstNameEn: z.string().max(100).optional(),
  lastNameEn: z.string().max(100).optional(),
});

export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;
