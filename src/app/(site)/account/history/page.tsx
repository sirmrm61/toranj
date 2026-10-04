import { HistoryList } from "@/components/account/history-list";
import { requirePageUser } from "@/lib/auth/page";
import { prisma } from "@/lib/db";
import { serializeJob } from "@/lib/tryon";

export default async function HistoryPage() {
  const user = await requirePageUser("/account/history");
  const jobs = await prisma.tryonJob.findMany({
    where: { userId: user.id },
    include: { gown: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
    take: 60,
  });
  const items = jobs.map((j) => {
    const s = serializeJob(j);
    return { ...s, createdAt: j.createdAt.toISOString(), finishedAt: j.finishedAt?.toISOString() ?? null };
  });
  return (
    <div>
      <h1 className="section-title mb-2">تاریخچه پروها</h1>
      <p className="mb-6 text-sm text-muted">عکس‌های اصلی شما ۳۰ روز پس از بارگذاری به‌طور خودکار حذف می‌شوند.</p>
      <HistoryList items={items} />
    </div>
  );
}
