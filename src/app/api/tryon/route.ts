import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { clientIp, handler, HttpError, json } from "@/lib/http";
import { createTryon, serializeJob } from "@/lib/tryon";

export const GET = handler(async () => {
  const user = await requireUser();
  const jobs = await prisma.tryonJob.findMany({
    where: { userId: user.id },
    include: { gown: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return json({ items: jobs.map(serializeJob) });
});

export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  const form = await req.formData().catch(() => null);
  if (!form) throw new HttpError(400, "فرم نامعتبر است.");
  const gownId = form.get("gownId");
  const photo = form.get("photo");
  const consent = form.get("consent");
  if (typeof gownId !== "string" || !gownId) throw new HttpError(422, "مدل لباس مشخص نشده است.");
  if (consent !== "true") throw new HttpError(422, "برای پرو آنلاین باید با شرایط استفاده از عکس موافقت کنید.");
  if (!(photo instanceof File) || photo.size === 0) throw new HttpError(422, "عکس تمام‌قد خود را انتخاب کنید.");

  const buffer = Buffer.from(await photo.arrayBuffer());
  const job = await createTryon(user, gownId, buffer, clientIp(req));
  return json({ jobId: job.id, status: job.status, bucket: job.bucketUsed }, 202);
});
