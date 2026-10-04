import IORedis from "ioredis";
import { env } from "./env";

const globalForRedis = globalThis as unknown as { redis?: IORedis };

export function getRedis(): IORedis {
  if (!globalForRedis.redis) {
    globalForRedis.redis = new IORedis(env.redisUrl, { maxRetriesPerRequest: null, lazyConnect: false });
  }
  return globalForRedis.redis;
}
