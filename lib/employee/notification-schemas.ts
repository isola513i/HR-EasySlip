import { z } from "zod";

export const NotificationPrefsSchema = z.object({
  notifyLeave: z.boolean().optional(),
  notifyApproval: z.boolean().optional(),
});

export type NotificationPrefsInput = z.infer<typeof NotificationPrefsSchema>;
