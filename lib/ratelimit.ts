/**
 * Lightweight, dependency-free fixed-window rate limiter.
 *
 * WHY in-memory: it adds a real first-line defense against runaway loops and
 * abuse without forcing the operator to provision Redis/Upstash. On a serverless
 * platform (Vercel) the counter is per-instance and resets on cold start, so it
 * is best-effort — NOT a global guarantee. For strict global limits, swap the
 * `Store` implementation for Upstash Redis (the public `checkRateLimit` API can
 * stay identical).
 */

interface Bucket {
  count: number;
  resetAt: number; // epoch ms
}

const store = new Map<string, Bucket>();

// Opportunistic cleanup so the map can't grow unbounded across many keys.
function sweep(now: number) {
  if (store.size < 5000) return;
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) store.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * @param key      Unique identifier for the caller + route (e.g. `ai:transcribe:<userId>`).
 * @param limit    Max requests allowed within the window.
 * @param windowMs Window size in milliseconds.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, limit, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { allowed: true, limit, remaining: limit - existing.count, retryAfterSeconds: 0 };
}

/** Standard 429 response with a Retry-After header. */
export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please slow down and try again." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfterSeconds),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
      },
    },
  );
}
