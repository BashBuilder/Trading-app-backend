/**
 * Lightweight in-memory rate limiter.
 *
 * This process runs as a single long-lived Node instance (e.g. on Render),
 * so an in-memory map is sufficient for now. It resets on redeploy/restart
 * and does NOT sync across multiple instances — if this service is ever
 * scaled horizontally, swap the Map below for Redis (INCR + EXPIRE) using
 * the same function signature.
 */

type ThrottleOptions = {
  /** Logical action name, e.g. "login", "otp:verify_email" */
  action: string;
  /** Who is being limited — email or IP */
  identifier: string;
  /** Max allowed attempts within the window */
  limit: number;
  /** Window size in seconds */
  windowSeconds: number;
};

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Periodically sweep expired buckets so the map doesn't grow unbounded.
const sweeper = setInterval(
  () => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  },
  5 * 60 * 1000,
);
sweeper.unref?.();

export function throttle({
  action,
  identifier,
  limit,
  windowSeconds,
}: ThrottleOptions): { allowed: boolean; retryAfter?: number } {
  const key = `${action}:${identifier}`;
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      retryAfter: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count += 1;
  return { allowed: true };
}
