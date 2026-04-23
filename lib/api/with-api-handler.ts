import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { DomainError } from "./errors";
import { apiError } from "./response";
import { checkIdempotency, storeIdempotency } from "./idempotency";
import { logger } from "@/lib/observability/logger";
import type { createRateLimiter } from "@/lib/security/rate-limit";

type RateLimiter = ReturnType<typeof createRateLimiter>;

export interface RequestContext {
  ip: string;
  userAgent: string;
  params: Record<string, string>;
  requestId: string;
}

type RouteContext = { params: Promise<Record<string, string>> };

type ApiHandler = (
  req: NextRequest,
  ctx: RequestContext,
) => Promise<NextResponse>;

interface HandlerOptions {
  rateLimit?: RateLimiter;
  rateLimitKey?: "ip" | "userId";
  idempotent?: boolean;
}

function setRequestId(response: NextResponse, requestId: string): NextResponse {
  response.headers.set("x-request-id", requestId);
  return response;
}

export function withApiHandler(handler: ApiHandler, options?: HandlerOptions) {
  return async (req: NextRequest, route: RouteContext): Promise<NextResponse> => {
    const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
    const startMs = Date.now();
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? req.headers.get("x-real-ip")
      ?? "unknown";
    const userAgent = req.headers.get("user-agent") ?? "";
    const params = await route.params;

    let rateLimitKeyValue = ip;
    let sessionUserId: string | undefined;

    if (options?.rateLimit && options.rateLimitKey === "userId") {
      const { auth } = await import("@/lib/auth");
      const session = await auth();
      sessionUserId = session?.user?.id;
      rateLimitKeyValue = sessionUserId ?? ip;
    }

    if (options?.rateLimit) {
      const result = options.rateLimit.check(rateLimitKeyValue);
      if (!result.success) {
        return setRequestId(
          apiError("RATE_LIMITED", "Too many requests", 429, { retryAfterMs: result.retryAfterMs }),
          requestId,
        );
      }
    }

    const idempotencyKey = options?.idempotent ? req.headers.get("x-idempotency-key") : null;
    if (idempotencyKey) {
      if (!sessionUserId) {
        const { auth } = await import("@/lib/auth");
        sessionUserId = (await auth())?.user?.id;
      }
      if (sessionUserId) {
        const cached = checkIdempotency(sessionUserId, idempotencyKey);
        if (cached) {
          return new NextResponse(cached.body, {
            status: cached.status,
            headers: { "Content-Type": "application/json", "X-Idempotent-Replay": "true", "x-request-id": requestId },
          });
        }
      }
    }

    try {
      const response = await handler(req, { ip, userAgent, params, requestId });

      if (idempotencyKey && sessionUserId && response.status < 500) {
        const body = await response.clone().text();
        storeIdempotency(sessionUserId, idempotencyKey, response.status, body);
      }

      logger.info("API request", {
        requestId, method: req.method, path: req.nextUrl.pathname,
        status: response.status, durationMs: Date.now() - startMs,
      });

      return setRequestId(response, requestId);
    } catch (err) {
      const errResponse = mapError(err, requestId, req);

      logger.error("API error", {
        requestId, method: req.method, path: req.nextUrl.pathname,
        status: errResponse.status, durationMs: Date.now() - startMs,
        error: err instanceof Error ? err.message : String(err),
      });

      return setRequestId(errResponse, requestId);
    }
  };
}

function mapError(err: unknown, _requestId: string, _req: NextRequest): NextResponse {
  if (err instanceof DomainError) {
    return apiError(err.code, err.message, err.httpStatus, err.details);
  }
  if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[] | undefined)?.join(", ") ?? "field";
      return apiError("CONFLICT", `Duplicate value for ${target}`, 409);
    }
    if (err.code === "P2034") {
      return apiError("CONFLICT", "Duplicate request — please try again", 409);
    }
  }
  if (err instanceof ZodError) {
    return apiError("VALIDATION_ERROR", "Invalid request data", 400,
      err.issues.map((i) => ({ path: i.path, message: i.message })));
  }
  if (err instanceof SyntaxError && err.message.includes("JSON")) {
    return apiError("INVALID_JSON", "Request body is not valid JSON", 400);
  }
  return apiError("INTERNAL_ERROR", "Internal server error", 500);
}
