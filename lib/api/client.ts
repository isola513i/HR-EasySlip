import type { ApiPaginated } from "@/types/api";

export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

const DEFAULT_TIMEOUT_MS = 30_000;

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  // Apply timeout unless caller already provided an AbortSignal
  const needsTimeout = !options?.signal;
  const ctrl = needsTimeout ? new AbortController() : undefined;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), DEFAULT_TIMEOUT_MS) : undefined;

  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json", ...options?.headers },
      ...options,
      ...(ctrl && { signal: ctrl.signal }),
    });
  const json = await res.json();
  if (!json.ok) {
    throw new ApiClientError(
      json.code ?? "UNKNOWN",
      json.error ?? "Unknown error",
      res.status,
      json.details,
    );
  }
  return json;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function apiFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const json = await fetchJson<{ data: T }>(url, options);
  return json.data;
}

export async function apiFetchPaginated<T>(
  url: string,
  options?: RequestInit,
): Promise<{ data: T[]; pagination: ApiPaginated<T>["pagination"] }> {
  const json = await fetchJson<{ data: T[]; pagination: ApiPaginated<T>["pagination"] }>(url, options);
  return { data: json.data, pagination: json.pagination };
}
