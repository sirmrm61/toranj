import { Queue } from "bullmq";
import { getRedis } from "./redis";

export const TRYON_QUEUE = "tryon";
export const MAINTENANCE_QUEUE = "maintenance";

export type TryonJobData = { jobId: string };

const globalForQueue = globalThis as unknown as { tryonQueue?: Queue<TryonJobData> };

export function tryonQueue() {
  globalForQueue.tryonQueue ??= new Queue<TryonJobData>(TRYON_QUEUE, { connection: getRedis() });
  return globalForQueue.tryonQueue;
}

export async function enqueueTryon(jobId: string) {
  await tryonQueue().add(
    "generate",
    { jobId },
    {
      jobId, // idempotent: the same try-on is never queued twice
      attempts: 3, // 1 try + 2 retries for transient errors (TRD §7.4)
      backoff: { type: "exponential", delay: 4000 },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    },
  );
}
