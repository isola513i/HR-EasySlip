import type { ApiPaginated } from "@/types/api";
import { offlineFetch } from "@/lib/offline/offline-fetch";

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

export class OfflineQueuedError extends Error {
  constructor() {
    super("OFFLINE_QUEUED");
    this.name = "OfflineQueuedError";
  }
}

const DEFAULT_TIMEOUT_MS = 30_000;

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const needsTimeout = !options?.signal;
  const ctrl = needsTimeout ? new AbortController() : undefined;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), DEFAULT_TIMEOUT_MS) : undefined;

  try {
    const res = await offlineFetch(url, {
      headers: { "Content-Type": "application/json", ...options?.headers },
      ...options,
      ...(ctrl && { signal: ctrl.signal }),
    });
    const json = await res.json();
    if ("offline" in json && json.offline === true) {
      throw new OfflineQueuedError();
    }
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
