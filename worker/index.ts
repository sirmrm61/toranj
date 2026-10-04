import "dotenv/config";
import { Queue, Worker } from "bullmq";
import { MAINTENANCE_QUEUE, TRYON_QUEUE, type TryonJobData } from "@/lib/queue";
import { getRedis } from "@/lib/redis";
import { failStuckJobs, purgeOldPhotos } from "./maintenance";
import { processTryon } from "./tryon";

const connection = getRedis();
const concurrency = Number(process.env.WORKER_CONCURRENCY ?? 4);

const tryonWorker = new Worker<TryonJobData>(TRYON_QUEUE, processTryon, { connection, concurrency });

const maintenanceQueue = new Queue(MAINTENANCE_QUEUE, { connection });
void Promise.all([
  maintenanceQueue.upsertJobScheduler("purge-old-photos", { every: 60 * 60 * 1000 }, { name: "purge" }),
  maintenanceQueue.upsertJobScheduler("fail-stuck-jobs", { every: 5 * 60 * 1000 }, { name: "watchdog" }),
]).catch((e) => console.error("[worker] failed to register maintenance schedules", e));

const maintenanceWorker = new Worker(
  MAINTENANCE_QUEUE,
  async (job) => {
    if (job.name === "purge") return { purged: await purgeOldPhotos() };
    if (job.name === "watchdog") return { failed: await failStuckJobs() };
  },
  { connection },
);

for (const w of [tryonWorker, maintenanceWorker]) {
  w.on("failed", (job, err) => console.warn(`[worker] ${w.name} job ${job?.id} failed: ${err.message}`));
}

console.info(`[worker] started (tryon concurrency=${concurrency})`);

async function shutdown() {
  console.info("[worker] shutting down");
  await Promise.all([tryonWorker.close(), maintenanceWorker.close(), maintenanceQueue.close()]);
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
