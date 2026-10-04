import { UnrecoverableError, type Job } from "bullmq";
import { getTryOnProvider, NoImageError, ProviderUnavailableError, SafetyBlockedError } from "@/lib/ai";
import { prisma } from "@/lib/db";
import { loadGownImage } from "@/lib/gown-images";
import { makeFull, makePreview } from "@/lib/images";
import type { TryonJobData } from "@/lib/queue";
import { getSettings } from "@/lib/settings";
import { keys, storage } from "@/lib/storage";
import { failJob } from "@/lib/tryon";

const MESSAGES = {
  safety: "تصویر توسط فیلتر ایمنی پذیرفته نشد؛ لطفاً یک عکس تمام‌قد ساده از خودتان (فقط یک نفر) بفرستید. اعتبار شما کسر نشد.",
  noImage: "تولید تصویر ناموفق بود؛ اعتبار شما برگشت داده شد. لطفاً با عکس دیگری دوباره تلاش کنید.",
  unavailable: "پرو آنلاین موقتاً در دسترس نیست؛ اعتبار شما کسر نشد. می‌توانید وقت پرو حضوری رزرو کنید.",
  generic: "خطایی در تولید تصویر رخ داد؛ اعتبار شما برگشت داده شد.",
};

function isLastAttempt(job: Job) {
  return job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
}

export async function processTryon(job: Job<TryonJobData>) {
  const { jobId } = job.data;
  const record = await prisma.tryonJob.findUnique({ where: { id: jobId }, include: { gown: true } });
  if (!record || record.status === "done" || record.status === "failed") return;

  await prisma.tryonJob.update({ where: { id: jobId }, data: { status: "running" } });
  const started = Date.now();
  try {
    const input = record.inputImageKey ? await storage.get(record.inputImageKey) : null;
    if (!input) throw new UnrecoverableError("input image missing");
    const refs = record.gown.tryonRefs.length ? record.gown.tryonRefs : record.gown.images.slice(0, 1);
    const gownImages = (await Promise.all(refs.slice(0, 3).map(loadGownImage))).filter((b): b is Buffer => !!b);
    if (gownImages.length === 0) throw new UnrecoverableError("gown reference image missing");

    const { tryonPrompt } = await getSettings();
    const provider = getTryOnProvider();
    const { image } = await provider.generate({ personImage: input.body, gownImages, prompt: tryonPrompt });

    const resultKey = keys.tryonResult(record.userId, jobId);
    const previewKey = keys.tryonPreview(record.userId, jobId);
    const [full, preview] = await Promise.all([makeFull(image), makePreview(image)]);
    // The full-quality original is only stored for paid try-ons (FR-16/17).
    if (record.bucketUsed === "paid") await storage.put(resultKey, full, "image/jpeg");
    await storage.put(previewKey, preview, "image/jpeg");

    await prisma.tryonJob.update({
      where: { id: jobId },
      data: {
        status: "done",
        resultKey: record.bucketUsed === "paid" ? resultKey : null,
        previewKey,
        error: null,
        finishedAt: new Date(),
      },
    });
    console.info(JSON.stringify({ evt: "tryon.done", jobId, provider: provider.name, ms: Date.now() - started }));
  } catch (err) {
    const permanent =
      err instanceof UnrecoverableError ||
      err instanceof SafetyBlockedError ||
      err instanceof ProviderUnavailableError ||
      isLastAttempt(job);
    console.error(JSON.stringify({ evt: "tryon.error", jobId, attempt: job.attemptsMade + 1, permanent, error: String(err) }));
    if (!permanent) {
      await prisma.tryonJob.update({ where: { id: jobId }, data: { status: "queued" } });
      throw err;
    }
    const msg =
      err instanceof SafetyBlockedError
        ? MESSAGES.safety
        : err instanceof NoImageError
          ? MESSAGES.noImage
          : err instanceof ProviderUnavailableError
            ? MESSAGES.unavailable
            : MESSAGES.generic;
    await failJob(jobId, msg);
    throw new UnrecoverableError(String(err));
  }
}
