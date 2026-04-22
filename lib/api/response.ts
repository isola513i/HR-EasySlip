// ════════════════════════════════════════════════════════════════
// Standardized API Response Helpers
// All API responses follow: { ok: true, data } | { ok: false, error, code }
// ════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";

interface SuccessResponse<T> {
  ok: true;
  data: T;
}

interface ErrorResponse {
  ok: false;
  error: string;
  code: string;
  details?: unknown;
}

interface PaginatedResponse<T> {
  ok: true;
  data: T[];
  pagination: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export function apiOk<T>(data: T, status = 200): NextResponse<SuccessResponse<T>> {
  return NextResponse.json({ ok: true as const, data }, { status });
}

export function apiCreated<T>(data: T): NextResponse<SuccessResponse<T>> {
  return apiOk(data, 201);
}

export function apiError(
  code: string,
  message: string,
  status: number,
  details?: unknown,
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    { ok: false as const, error: message, code, ...(details ? { details } : {}) },
    { status },
  );
}

export function apiPaginated<T>(
  data: T[],
  total: number,
  page: number,
  perPage: number,
): NextResponse<PaginatedResponse<T>> {
  return NextResponse.json({
    ok: true as const,
    data,
    pagination: {
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    },
  });
}
