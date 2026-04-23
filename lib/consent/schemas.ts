import { z } from "zod";

export const ConsentGrantSchema = z.object({});

export type ConsentGrantInput = z.infer<typeof ConsentGrantSchema>;
