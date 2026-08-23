/**
 * Fixed-window rate limiter, keyed by client IP, backed by a plain
 * in-memory Map. This is enough to stop the endpoint being used as an open
 * URL-fetching proxy on a single server instance — it resets per process,
 * so a multi-instance/serverless deploy with several concurrent instances
 * would let each instance track its own count independently (effectively
 * multiplying the real limit by the instance count). If this ever needs to
 * hold across multiple instances, replace this Map with a shared store
 * (e.g. Upstash Redis) — not needed at this volume today.
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 10;

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart >= WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now });
    pruneExpired(now);
    return { allowed: true };
  }

  if (bucket.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.windowStart + WINDOW_MS - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true };
}

/** Lazy cleanup on the request path rather than a setInterval — a background timer isn't guaranteed to run between invocations in every deploy target. */
function pruneExpired(now: number): void {
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart >= WINDOW_MS) {
      buckets.delete(key);
    }
  }
}
