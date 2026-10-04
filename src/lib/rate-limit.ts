import { getRedis } from "./redis";

export type RateLimitResult = { ok: boolean; remaining: number; retryAfter: number };

/** Fixed-window counter in Redis. */
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<RateLimitResult> {
  const redis = getRedis();
  const k = `rl:${key}`;
  const [[, count], [, ttl]] = (await redis.multi().incr(k).ttl(k).exec()) as [[unknown, number], [unknown, number]];
  if (ttl < 0) await redis.expire(k, windowSec);
  const retryAfter = ttl < 0 ? windowSec : ttl;
  return { ok: count <= limit, remaining: Math.max(0, limit - count), retryAfter };
}
