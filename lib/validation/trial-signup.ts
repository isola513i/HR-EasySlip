import { z } from "zod";
import { isReservedSlug } from "@/lib/tenant/reserved-slugs";

export const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;
export const PHONE_RE = /^(\+66|0)[0-9]{8,9}$|^\+[1-9][0-9]{6,14}$/;

export const TrialSignupSchema = z.object({
  companyName: z.string().min(2).max(120),
  desiredSlug: z
    .string()
    .min(3)
    .max(30)
    .toLowerCase()
    .refine((v) => SLUG_RE.test(v), { message: "SLUG_INVALID" })
    .refine((v) => !isReservedSlug(v), { message: "SLUG_INVALID" }),
  contactName: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z
    .string()
    .transform((v) => v.replace(/[\s\-()]/g, ""))
    .refine((v) => v === "" || PHONE_RE.test(v), { message: "PHONE_INVALID" })
    .optional(),
  teamSize: z.string().min(1).max(50),
});

export type TrialSignupInput = z.infer<typeof TrialSignupSchema>;
