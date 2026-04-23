import { describe, test, expect, mock, beforeEach } from "bun:test";
import { apiFetch, apiFetchPaginated, ApiClientError } from "./client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFetch = mock<any>(() => Promise.resolve(new Response()));

beforeEach(() => {
  mockFetch.mockReset();
  globalThis.fetch = mockFetch as unknown as typeof fetch;
});

describe("apiFetch", () => {
  test("success — returns data", async () => {
    mockFetch.mockResolvedValueOnce(
      Response.json({ ok: true, data: { id: "1", name: "test" } }),
    );
    const result = await apiFetch<{ id: string }>("/api/test");
    expect(result.id).toBe("1");
  });

  test("API error response (ok: false) — throws ApiClientError", async () => {
    mockFetch.mockResolvedValueOnce(
      Response.json({ ok: false, code: "NOT_FOUND", error: "Not found" }, { status: 404 }),
    );
    try {
      await apiFetch("/api/test");
      expect(true).toBe(false); // should not reach
    } catch (err) {
      expect(err).toBeInstanceOf(ApiClientError);
      const e = err as ApiClientError;
      expect(e.code).toBe("NOT_FOUND");
      expect(e.status).toBe(404);
    }
  });

  test("network error — throws", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await expect(apiFetch("/api/test")).rejects.toThrow("Failed to fetch");
  });
});

describe("apiFetchPaginated", () => {
  test("returns data + pagination", async () => {
    mockFetch.mockResolvedValueOnce(
      Response.json({
        ok: true,
        data: [{ id: "1" }, { id: "2" }],
        pagination: { total: 10, page: 1, perPage: 20, totalPages: 1 },
      }),
    );
    const result = await apiFetchPaginated<{ id: string }>("/api/test");
    expect(result.data).toHaveLength(2);
    expect(result.pagination.total).toBe(10);
  });

  test("API error — throws ApiClientError", async () => {
    mockFetch.mockResolvedValueOnce(
      Response.json({ ok: false, code: "FORBIDDEN", error: "No access" }, { status: 403 }),
    );
    await expect(apiFetchPaginated("/api/test")).rejects.toThrow("No access");
  });
});
