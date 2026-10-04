import Link from "next/link";
import { fa, toman } from "@/lib/format";
import { dashboardReport } from "@/lib/reports";

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-espresso">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

const pct = (x: number) => `${fa(Math.round(x * 100))}٪`;

export default async function AdminHome() {
  const r = await dashboardReport(30);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-espresso">داشبورد (۳۰ روز اخیر)</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="کاربران" value={fa(r.users)} hint={`${fa(r.newUsers)} کاربر جدید`} />
        <Stat label="رزروهای پرو حضوری" value={fa(r.newBookings)} hint={`کل: ${fa(r.bookings)}`} />
        <Stat label="درآمد فروش اعتبار" value={toman(r.revenueIrr)} hint={`${fa(r.paymentsCount)} پرداخت · ${fa(r.creditsSold)} اعتبار`} />
        <Stat label="تبدیل به پرداخت" value={pct(r.conversion)} hint="کاربران پرو کرده → خریدار" />
        <Stat label="پروهای موفق" value={fa(r.tryons.done)} hint={`${fa(r.tryons.free)} رایگان · ${fa(r.tryons.paid)} پولی`} />
        <Stat label="نرخ موفقیت تولید" value={pct(r.successRate)} hint={`${fa(r.tryons.failed)} ناموفق · ${fa(r.tryons.pending)} در صف`} />
        <Stat label="هزینه تخمینی پردازش" value={toman(r.estimatedCostIrr)} />
        <Stat label="دعوت‌های موفق" value={fa(r.referrals.rewarded ?? 0)} hint={`${fa(r.referrals.registered ?? 0)} در انتظار خرید · ${fa(r.referrals.rejected ?? 0)} مشکوک`} />
      </div>
      {r.reported > 0 && (
        <Link href="/admin/tryons" className="card block border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          {fa(r.reported)} نتیجه پرو توسط کاربران گزارش شده و منتظر بررسی است.
        </Link>
      )}
    </div>
  );
}
