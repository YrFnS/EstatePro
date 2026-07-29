import type { NextRequest } from "next/server";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitStore = Map<string, RateLimitEntry>;

const globalRateLimit = globalThis as typeof globalThis & {
  __estateProRateLimit?: RateLimitStore;
};

const store =
  globalRateLimit.__estateProRateLimit ||
  (globalRateLimit.__estateProRateLimit = new Map<string, RateLimitEntry>());

function clientAddress(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

export function checkRateLimit(
  request: NextRequest,
  scope: string,
  options: { limit: number; windowMs: number }
): { allowed: boolean; retryAfter: number; remaining: number } {
  const now = Date.now();
  const key = `${scope}:${clientAddress(request)}`;
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + options.windowMs });
    return {
      allowed: true,
      retryAfter: Math.ceil(options.windowMs / 1000),
      remaining: Math.max(0, options.limit - 1),
    };
  }

  current.count += 1;
  store.set(key, current);

  return {
    allowed: current.count <= options.limit,
    retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    remaining: Math.max(0, options.limit - current.count),
  };
}
