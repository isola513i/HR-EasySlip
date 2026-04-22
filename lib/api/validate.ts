// ════════════════════════════════════════════════════════════════
// Request Validation — parse body & search params with Zod
// ════════════════════════════════════════════════════════════════

import type { NextRequest } from "next/server";
import type { z } from "zod";

/**
 * Parse and validate JSON request body against a Zod schema.
 * Throws ZodError on validation failure (caught by withApiHandler).
 */
export async function parseBody<T extends z.ZodType>(
  req: NextRequest,
  schema: T,
): Promise<z.infer<T>> {
  const raw = await req.json();
  return schema.parse(raw);
}

/**
 * Parse and validate URL search params against a Zod schema.
 * Throws ZodError on validation failure.
 */
export function parseSearchParams<T extends z.ZodType>(
  req: NextRequest,
  schema: T,
): z.infer<T> {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  return schema.parse(params);
}
