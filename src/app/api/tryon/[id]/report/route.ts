import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { handler, HttpError, json } from "@/lib/http";
import { getOwnJob } from "@/lib/tryon";

/** "Report an unsuitable result" — the admin reviews it and may refund the credit. */
export const POST = handler(async (_req: Request, ctx: RouteContext<"/api/tryon/[id]/report">) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const job = await getOwnJob(user, id);
  if (job.status !== "done") throw new HttpError(422, "فقط نتایج تکمیل‌شده قابل گزارش هستند.");
  await prisma.tryonJob.update({ where: { id }, data: { reported: true } });
  await audit("tryon.reported", user.id, { jobId: id });
  return json({ ok: true });
});
