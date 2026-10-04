import type { TryonJob, User } from "@/generated/prisma/client";
import { audit } from "@/lib/audit";
import { refundCredit, reserveCredit } from "@/lib/credits/ledger";
import { prisma } from "@/lib/db";
import { HttpError } from "@/lib/http";
import { normalizeUpload } from "@/lib/images";
import { enqueueTryon } from "@/lib/queue";
import { rateLimit } from "@/lib/rate-limit";
import { keys, storage } from "@/lib/storage";
import { signTryonUrl } from "@/lib/storage/signed";

export const TRYON_RETENTION_DAYS = 30;

export async function createTryon(user: User, gownId: string, file: Buffer, ip: string) {
  const [perUser, perIp] = await Promise.all([
    rateLimit(`tryon:user:${user.id}`, 10, 3600),
    rateLimit(`tryon:ip:${ip}`, 30, 3600),
  ]);
  if (!perUser.ok || !perIp.ok) throw new HttpError(429, "تعداد درخواست‌های پرو زیاد است؛ کمی بعد تلاش کنید.", "rate_limited");

  const gown = await prisma.gown.findUnique({ where: { id: gownId } });
  if (!gown || gown.status === "HIDDEN") throw new HttpError(404, "لباس موردنظر پیدا نشد.");
  if (gown.tryonRefs.length === 0 && gown.images.length === 0) throw new HttpError(422, "پرو آنلاین برای این مدل فعال نیست.");

  const image = await normalizeUpload(file);
  const jobId = crypto.randomUUID();
  const inputKey = keys.tryonInput(user.id, jobId);
  await storage.put(inputKey, image, "image/jpeg");

  let job: TryonJob;
  try {
    job = await prisma.$transaction(async (tx) => {
      const bucket = await reserveCredit(tx, user.id, jobId);
      return tx.tryonJob.create({
        data: { id: jobId, userId: user.id, gownId, inputImageKey: inputKey, bucketUsed: bucket, status: "queued" },
      });
    });
  } catch (e) {
    await storage.delete(inputKey).catch(() => {});
    throw e;
  }

  try {
    await enqueueTryon(job.id);
  } catch (e) {
    console.error("[tryon] enqueue failed", e);
    await failJob(job.id, "سرویس پرو آنلاین موقتاً در دسترس نیست؛ اعتبار شما برگشت داده شد.");
    throw new HttpError(503, "سرویس پرو آنلاین موقتاً در دسترس نیست؛ اعتبار شما کسر نشد. می‌توانید وقت پرو حضوری رزرو کنید.");
  }
  return job;
}

/** Marks a job failed and returns its credit (FR-11). Idempotent. */
export async function failJob(jobId: string, error: string) {
  await prisma.$transaction(async (tx) => {
    await tx.tryonJob.update({ where: { id: jobId }, data: { status: "failed", error, finishedAt: new Date() } });
    await refundCredit(jobId, error, tx);
  });
}

export function serializeJob(job: TryonJob & { gown?: { name: string; slug: string } }) {
  const done = job.status === "done";
  const paid = job.bucketUsed === "paid";
  return {
    id: job.id,
    status: job.status,
    bucket: job.bucketUsed,
    gown: job.gown ? { name: job.gown.name, slug: job.gown.slug } : undefined,
    error: job.error,
    reported: job.reported,
    createdAt: job.createdAt,
    finishedAt: job.finishedAt,
    previewUrl: done && job.previewKey ? signTryonUrl(job.id, "preview", job.userId) : null,
    fullUrl: done && paid && job.resultKey ? signTryonUrl(job.id, "full", job.userId) : null,
    downloadUrl: done && paid && job.resultKey ? signTryonUrl(job.id, "full", job.userId, true) : null,
    canDownload: done && paid,
  };
}

export async function getOwnJob(user: User, id: string) {
  const job = await prisma.tryonJob.findUnique({ where: { id }, include: { gown: { select: { name: true, slug: true } } } });
  if (!job || job.userId !== user.id) throw new HttpError(404, "پرو پیدا نشد.");
  return job;
}

/** Deletes the user's photo and the generated images (FR-14). */
export async function deleteTryonFiles(job: TryonJob) {
  const toDelete = [job.inputImageKey, job.resultKey, job.previewKey].filter(Boolean) as string[];
  await Promise.all(toDelete.map((k) => storage.delete(k).catch(() => {})));
}

export async function deleteTryon(user: User, id: string) {
  const job = await getOwnJob(user, id);
  await deleteTryonFiles(job);
  await prisma.tryonJob.update({
    where: { id },
    data: { inputImageKey: null, resultKey: null, previewKey: null, inputDeletedAt: new Date() },
  });
  await prisma.tryonJob.delete({ where: { id } }).catch(() => {});
  await audit("tryon.deleted", user.id, { jobId: id });
}
