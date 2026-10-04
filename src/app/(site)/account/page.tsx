import Link from "next/link";
import { getAccountSummary } from "@/lib/account";
import { requirePageUser } from "@/lib/auth/page";
import { prisma } from "@/lib/db";
import { fa } from "@/lib/format";
import { formatFaDate } from "@/lib/jalali";

const STATUS = { queued: "در صف", running: "در حال پردازش", done: "آماده", failed: "ناموفق" } as const;

export default async function AccountPage() {
  const user = await requirePageUser("/account");
  const [s, recent] = await Promise.all([
    getAccountSummary(user),
    prisma.tryonJob.findMany({ where: { userId: user.id }, include: { gown: true }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);
  return (
    <div className="space-y-6">
      <div className="card bg-gradient-to-l from-espresso to-cocoa p-8 text-white">
        <p className="text-sm text-white/70">اعتبار پرو آنلاین شما</p>
        <p className="mt-2 text-5xl font-black">{fa(s.balances.total)}</p>
        <p className="mt-2 text-sm text-white/70">
          {fa(s.balances.free)} رایگان (پیش‌نمایش با واترمارک) · {fa(s.balances.paid)} خریداری‌شده (کیفیت کامل و قابل دانلود)
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/account/tryon" className="btn-gold">پرو آنلاین جدید</Link>
          <Link href="/account/wallet" className="btn-ghost-light">خرید اعتبار</Link>
          <Link href="/account/invite" className="btn-ghost-light">دعوت از دوستان (+۳ پرو)</Link>
        </div>
      </div>
      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-espresso">آخرین پروها</h2>
          <Link href="/account/history" className="text-sm text-gold-dark">مشاهده همه</Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-muted">هنوز پرو آنلاینی انجام نداده‌اید.</p>
        ) : (
          <ul className="divide-y divide-sand text-sm">
            {recent.map((j) => (
              <li key={j.id} className="flex items-center justify-between py-3">
                <span>{j.gown.name}</span>
                <span className="text-muted">{formatFaDate(j.createdAt, true)}</span>
                <span className="badge">{STATUS[j.status]}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
