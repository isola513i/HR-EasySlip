import { enqueueRequest } from "./offline-queue";

const OFFLINE_POST_PATHS = [
  "/api/v1/attendance/clock",
  "/api/v1/leave/requests",
  "/api/v1/attendance/adjustment",
  "/api/v1/overtime/requests",
];

function isOfflineEligible(url: string, method: string): boolean {
  return method === "POST" && OFFLINE_POST_PATHS.some((p) => url.includes(p));
}

/**
 * Wraps fetch for mutation endpoints — queues to IndexedDB on network failure.
 * Returns a synthetic response so the UI can show "queued" state.
 */
export async function offlineFetch(
  url: string,
  options: RequestInit,
): Promise<Response> {
  try {
    const res = await fetch(url, options);
    return res;
  } catch (err) {
    if (!isOfflineEligible(url, options.method ?? "GET")) throw err;
    if (navigator.onLine) throw err;

    await enqueueRequest(url, options.method ?? "POST", options.body as string);

    return new Response(
      JSON.stringify({ ok: true, data: { queued: true }, offline: true }),
      { status: 202, headers: { "Content-Type": "application/json" } },
    );
  }
}
