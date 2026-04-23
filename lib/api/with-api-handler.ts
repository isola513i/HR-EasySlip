// ════════════════════════════════════════════════════════════════
// withApiHandler — HOF wrapper for Next.js API route handlers
// Provides: error mapping, rate limiting, request context
// ════════════════════════════════════════════════════════════════

import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { DomainError } from "./errors";
import { apiError } from "./response";
import type { createRateLimiter } from "@/lib/security/rate-limit";

type RateLimiter = ReturnType<typeof createRateLimiter>;

export interface RequestContext {
  ip: string;
  userAgent: string;
  params: Record<string, string>;
}

type RouteContext = { params: Promise<Record<string, string>> };

type ApiHandler = (
  req: NextRequest,
  ctx: RequestContext,
) => Promise<NextResponse>;

interface HandlerOptions {
  rateLimit?: RateLimiter;
}

/**
 * Wrap an API route handler with standardized error handling.
 *
 * Usage:
 *   export const POST = withApiHandler(async (req, ctx) => {
 *     const caller = await requireApiRoles(EMPLOYEE_ROLES);
 *     if (caller instanceof NextResponse) return caller;
 *     // ... business logic
 *   });
 */
export function withApiHandler(handler: ApiHandler, options?: HandlerOptions) {
  return async (req: NextRequest, route: RouteContext): Promise<NextResponse> => {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? req.headers.get("x-real-ip")
      ?? "unknown";
    const userAgent = req.headers.get("user-agent") ?? "";
    const params = await route.params;

    // Rate limiting (if configured)
    if (options?.rateLimit) {
      const result = options.rateLimit.check(ip);
      if (!result.success) {
        return apiError(
          "RATE_LIMITED",
          "Too many requests",
          429,
          { retryAfterMs: result.retryAfterMs },
        );
      }
    }

    try {
      return await handler(req, { ip, userAgent, params });
    } catch (err) {
      if (err instanceof DomainError) {
        return apiError(err.code, err.message, err.httpStatus, err.details);
      }
      if (err instanceof ZodError) {
        return apiError(
          "VALIDATION_ERROR",
          "Invalid request data",
          400,
          err.issues.map((i) => ({ path: i.path, message: i.message })),
        );
      }
      if (err instanceof SyntaxError && err.message.includes("JSON")) {
        return apiError("INVALID_JSON", "Request body is not valid JSON", 400);
      }
      console.error("[API Error]", req.method, req.nextUrl.pathname, err);
      return apiError("INTERNAL_ERROR", "Internal server error", 500);
    }
  };
}
