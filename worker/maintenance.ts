import { prisma } from "@/lib/db";
import { storage } from "@/lib/storage";
import { failJob, TRYON_RETENTION_DAYS } from "@/lib/tryon";

/** Deletes original user photos older than the retention window (FR-14). */
export async function purgeOldPhotos() {
  const cutoff = new Date(Date.now() - TRYON_RETENTION_DAYS * 86400_000);
  const jobs = await prisma.tryonJob.findMany({
    where: { createdAt: { lt: cutoff }, inputDeletedAt: null, inputImageKey: { not: null } },
    take: 500,
  });
  for (const job of jobs) {
    await storage.delete(job.inputImageKey!).catch((e) => console.error("[purge] delete failed", job.id, e));
    await prisma.tryonJob.update({ where: { id: job.id }, data: { inputImageKey: null, inputDeletedAt: new Date() } });
  }
  return jobs.length;
}

/** Watchdog: jobs stuck in queued/running for too long are failed and refunded. */
export async function failStuckJobs(maxAgeMin = 20) {
  const cutoff = new Date(Date.now() - maxAgeMin * 60_000);
  const stuck = await prisma.tryonJob.findMany({
    where: { status: { in: ["queued", "running"] }, createdAt: { lt: cutoff } },
    take: 200,
  });
  for (const job of stuck) await failJob(job.id, "زمان پردازش بیش از حد طول کشید؛ اعتبار شما برگشت داده شد.");
  return stuck.length;
}
