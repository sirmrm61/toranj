import { dismissReport, refundTryon } from "@/app/admin/actions";
import { prisma } from "@/lib/db";
import { formatFaDate } from "@/lib/jalali";

const STATUS = { queued: "در صف", running: "در حال پردازش", done: "موفق", failed: "ناموفق" } as const;

export default async function AdminTryons({ searchParams }: PageProps<"/admin/tryons">) {
  const { all } = await searchParams;
  const jobs = await prisma.tryonJob.findMany({
    where: all ? {} : { reported: true },
    include: { user: { select: { phone: true } }, gown: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const refunded = new Set(
    (await prisma.creditLedger.findMany({ where: { type: "refund", refId: { in: jobs.map((j) => j.id) } }, select: { refId: true } })).map((r) => r.refId),
  );
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-espresso">{all ? "همه پروها" : "پروهای گزارش‌شده"}</h1>
        <a href={all ? "/admin/tryons" : "/admin/tryons?all=1"} className="text-sm text-gold-dark underline">{all ? "فقط گزارش‌شده‌ها" : "نمایش همه"}</a>
      </div>
      <p className="mb-4 text-xs text-muted">به‌دلیل حریم خصوصی، تصاویر کاربران در پنل مدیر نمایش داده نمی‌شوند.</p>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream text-right text-xs text-muted">
            <tr><th className="p-3">تاریخ</th><th className="p-3">کاربر</th><th className="p-3">لباس</th><th className="p-3">اعتبار</th><th className="p-3">وضعیت</th><th className="p-3">خطا</th><th className="p-3" /></tr>
          </thead>
          <tbody className="divide-y divide-sand">
            {jobs.map((j) => (
              <tr key={j.id}>
                <td className="p-3 text-xs text-muted">{formatFaDate(j.createdAt, true)}</td>
                <td className="p-3" dir="ltr">{j.user.phone}</td>
                <td className="p-3">{j.gown.name}</td>
                <td className="p-3">{j.bucketUsed === "paid" ? "پولی" : "رایگان"}{refunded.has(j.id) && " (برگشت داده شد)"}</td>
                <td className="p-3">{STATUS[j.status]}{j.reported && " · گزارش‌شده"}</td>
                <td className="max-w-56 p-3 text-xs">{j.error}</td>
                <td className="flex gap-1 p-3">
                  {j.status === "done" && !refunded.has(j.id) && (
                    <form action={refundTryon}><input type="hidden" name="id" value={j.id} /><button className="btn-outline px-2 py-1 text-xs">برگشت اعتبار</button></form>
                  )}
                  {j.reported && (
                    <form action={dismissReport}><input type="hidden" name="id" value={j.id} /><button className="btn px-2 py-1 text-xs">رد گزارش</button></form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
