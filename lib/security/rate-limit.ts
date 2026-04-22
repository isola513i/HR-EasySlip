// ════════════════════════════════════════════════════════════════
// In-memory sliding window rate limiter
// ────────────────────────────────────────────────────────────────
// Zero dependency. Sufficient for ~50-user internal app on single
// Node.js process. For multi-instance deploy, swap to Upstash Redis.
// ════════════════════════════════════════════════════════════════

interface RateLimitEntry {
  timestamps: number[];
}

interface RateLimitConfig {
  /** Max requests allowed within the window */
  maxRequests: number;
  /** Window size in milliseconds */
  windowMs: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

function getStore(name: string): Map<string, RateLimitEntry> {
  let store = stores.get(name);
  if (!store) {
    store = new Map();
    stores.set(name, store);
  }
  return store;
}

export function createRateLimiter(name: string, config: RateLimitConfig) {
  const store = getStore(name);

  return {
    /** Returns { success: true } if allowed, { success: false, retryAfterMs } if blocked */
    check(key: string): { success: boolean; retryAfterMs?: number } {
      const now = Date.now();
      const windowStart = now - config.windowMs;

      let entry = store.get(key);
      if (!entry) {
        entry = { timestamps: [] };
        store.set(key, entry);
      }

      // Prune expired timestamps
      entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

      if (entry.timestamps.length >= config.maxRequests) {
        const oldest = entry.timestamps[0]!;
        const retryAfterMs = oldest + config.windowMs - now;
        return { success: false, retryAfterMs };
      }

      entry.timestamps.push(now);
      return { success: true };
    },

    /** Clean up stale entries (call periodically if needed) */
    cleanup() {
      const now = Date.now();
      const windowStart = now - config.windowMs;
      for (const [key, entry] of store) {
        entry.timestamps = entry.timestamps.filter((t) => t > windowStart);
        if (entry.timestamps.length === 0) store.delete(key);
      }
    },
  };
}

// ── Pre-configured limiters ──

/** Magic link: 3 requests per minute per email */
export const magicLinkLimiter = createRateLimiter("magic-link", {
  maxRequests: 3,
  windowMs: 60_000,
});

/** Auth endpoints: 10 requests per minute per IP */
export const authEndpointLimiter = createRateLimiter("auth-endpoint", {
  maxRequests: 10,
  windowMs: 60_000,
});

/**
 * Account lockout: 5 failed sign-in attempts per email in 15 minutes.
 * After lockout, the user must wait for the window to expire.
 * Unlike magicLinkLimiter (which counts sends), this counts
 * blocked/failed sign-in callback results.
 */
export const signInAttemptLimiter = createRateLimiter("signin-attempt", {
  maxRequests: 5,
  windowMs: 15 * 60_000, // 15 minutes
});
