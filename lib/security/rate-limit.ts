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
    /**
     * Check if blocked AND record the attempt in one call.
     * Use for limiters that count all requests (e.g. magicLinkLimiter).
     */
    check(key: string): { success: boolean; retryAfterMs?: number } {
      const blocked = this.peek(key);
      if (!blocked.success) return blocked;
      this.record(key);
      return { success: true };
    },

    /**
     * Check if the key is currently blocked — does NOT record an attempt.
     * Use this at the start of a flow to gate access without incrementing.
     */
    peek(key: string): { success: boolean; retryAfterMs?: number } {
      const now = Date.now();
      const windowStart = now - config.windowMs;
      const entry = store.get(key);
      if (!entry) return { success: true };

      const active = entry.timestamps.filter((t) => t > windowStart);
      if (active.length >= config.maxRequests) {
        const oldest = active[0]!;
        const retryAfterMs = oldest + config.windowMs - now;
        return { success: false, retryAfterMs };
      }
      return { success: true };
    },

    /**
     * Record a failed attempt without checking the limit.
     * Use after a validated failure (e.g. blocked sign-in) to increment the counter.
     */
    record(key: string): void {
      const now = Date.now();
      const windowStart = now - config.windowMs;

      let entry = store.get(key);
      if (!entry) {
        entry = { timestamps: [] };
        store.set(key, entry);
      }
      entry.timestamps = entry.timestamps.filter((t) => t > windowStart);
      entry.timestamps.push(now);
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
