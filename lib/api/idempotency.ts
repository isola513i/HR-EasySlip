// In-memory idempotency store for mobile double-submit protection.
// Key: `${userId}:${idempotencyKey}` → cached response
// TTL: 10 minutes. Lazy eviction on read.
// Single-process only — matches existing rate-limit pattern (~50 users).

const TTL_MS = 10 * 60 * 1000;

interface StoredResponse {
  status: number;
  body: string;
  createdAt: number;
}

const store = new Map<string, StoredResponse>();

function compositeKey(userId: string, key: string): string {
  return `${userId}:${key}`;
}

export function checkIdempotency(userId: string, key: string): StoredResponse | null {
  const k = compositeKey(userId, key);
  const entry = store.get(k);
  if (!entry) return null;

  if (Date.now() - entry.createdAt > TTL_MS) {
    store.delete(k);
    return null;
  }

  return entry;
}

export function storeIdempotency(
  userId: string,
  key: string,
  status: number,
  body: string,
): void {
  const k = compositeKey(userId, key);
  store.set(k, { status, body, createdAt: Date.now() });

  // Lazy eviction: clean up expired entries when store grows
  if (store.size > 500) {
    const now = Date.now();
    for (const [storeKey, entry] of store) {
      if (now - entry.createdAt > TTL_MS) store.delete(storeKey);
    }
  }
}
