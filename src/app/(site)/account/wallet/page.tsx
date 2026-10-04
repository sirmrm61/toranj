import { BuyButton } from "@/components/account/buy-button";
import { requirePageUser } from "@/lib/auth/page";
import { getBalances } from "@/lib/credits/ledger";
import { prisma } from "@/lib/db";
import { fa, toman } from "@/lib/format";
import { formatFaDate } from "@/lib/jalali";

const LEDGER_LABELS = {
  free_signup: "هدیه ثبت‌نام",
  referral_bonus: "هدیه دعوت از دوستان",
  purchase: "خرید بسته",
  consume: "مصرف پرو",
  refund: "برگشت اعتبار (خطا)",
  reversal: "لغو / بازگشت وجه",
  admin_adjust: "اصلاح توسط مدیر",
} as const;

const PAY_STATUS = { PENDING: "در انتظار", PAID: "موفق", FAILED: "ناموفق", REFUNDED: "بازگشت وجه" } as const;

export default async function WalletPage({ searchParams }: PageProps<"/account/wallet">) {
  const user = await requirePageUser("/account/wallet");
  const { payment } = await searchParams;
  const [balances, packages, ledger, payments] = await Promise.all([
    getBalances(user.id),
    prisma.creditPackage.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.creditLedger.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.payment.findMany({ where: { userId: user.id }, include: { package: true }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  return (
    <div className="space-y-8">
      {payment === "success" && (
        <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800" role="status">پرداخت با موفقیت انجام شد و اعتبار به حساب شما اضافه شد.</p>
      )}
      {(payment === "failed" || payment === "error") && (
        <p className="rounded-xl bg-red-50 p-4 text-sm text-red-800" role="alert">
          پرداخت انجام نشد. اگر مبلغی از حساب شما کسر شده، طی ۷۲ ساعت توسط بانک برگشت داده می‌شود.
        </p>
      )}
      <div>
        <h1 className="section-title">کیف اعتبار</h1>
        <p className="mt-2 text-sm text-muted">
          موجودی: {fa(balances.free)} پرو رایگان + {fa(balances.paid)} پرو خریداری‌شده. ابتدا اعتبار رایگان مصرف می‌شود.
        </p>
      </div>

      <section>
        <h2 className="mb-4 font-bold text-espresso">بسته‌های اعتبار</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {packages.map((p, i) => (
            <div key={p.id} className={`card relative p-6 ${i === 1 ? "ring-2 ring-gold" : ""}`}>
              {i === 1 && <span className="badge absolute -top-3 right-4 bg-gold text-white">پیشنهاد ما</span>}
              <h3 className="font-bold text-espresso">{p.title}</h3>
              <p className="mt-3 text-3xl font-black text-espresso">{fa(p.credits)} <span className="text-base font-medium text-muted">پرو</span></p>
              <p className="mt-1 text-sm text-gold-dark">{toman(p.priceIrr)}</p>
              <p className="mt-1 text-xs text-muted">هر پرو {toman(Math.round(p.priceIrr / p.credits))}</p>
              <ul className="mt-4 space-y-1 text-xs text-muted">
                <li>✓ کیفیت کامل بدون واترمارک سنگین</li>
                <li>✓ قابل دانلود</li>
                <li>✓ بدون تاریخ انقضا</li>
              </ul>
              <BuyButton packageId={p.id} label="خرید و پرداخت" />
            </div>
          ))}
        </div>
      </section>

      <section className="card overflow-x-auto p-6">
        <h2 className="mb-4 font-bold text-espresso">گردش اعتبار</h2>
        <table className="w-full text-sm">
          <thead className="text-right text-xs text-muted">
            <tr><th className="pb-2">تاریخ</th><th className="pb-2">شرح</th><th className="pb-2">نوع</th><th className="pb-2">تعداد</th></tr>
          </thead>
          <tbody className="divide-y divide-sand">
            {ledger.map((l) => (
              <tr key={l.id}>
                <td className="py-2 text-muted">{formatFaDate(l.createdAt, true)}</td>
                <td className="py-2">{LEDGER_LABELS[l.type]}</td>
                <td className="py-2">{l.bucket === "free" ? "رایگان" : "پولی"}</td>
                <td className={`py-2 font-semibold ${l.amount < 0 ? "text-red-700" : "text-emerald-700"}`} dir="ltr">{l.amount > 0 ? `+${l.amount}` : l.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {payments.length > 0 && (
        <section className="card overflow-x-auto p-6">
          <h2 className="mb-4 font-bold text-espresso">پرداخت‌ها</h2>
          <table className="w-full text-sm">
            <thead className="text-right text-xs text-muted">
              <tr><th className="pb-2">تاریخ</th><th className="pb-2">بسته</th><th className="pb-2">مبلغ</th><th className="pb-2">وضعیت</th><th className="pb-2">کد پیگیری</th></tr>
            </thead>
            <tbody className="divide-y divide-sand">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="py-2 text-muted">{formatFaDate(p.createdAt, true)}</td>
                  <td className="py-2">{p.package.title}</td>
                  <td className="py-2">{toman(p.amountIrr)}</td>
                  <td className="py-2">{PAY_STATUS[p.status]}</td>
                  <td className="py-2 text-xs" dir="ltr">{p.refNumber ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
