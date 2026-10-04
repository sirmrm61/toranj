import { refundPaymentAction, savePackage } from "@/app/admin/actions";
import { prisma } from "@/lib/db";
import { fa, toman } from "@/lib/format";
import { formatFaDate } from "@/lib/jalali";

const STATUS = { PENDING: "در انتظار", PAID: "موفق", FAILED: "ناموفق", REFUNDED: "بازگشت وجه" } as const;

export default async function AdminPayments() {
  const [packages, payments] = await Promise.all([
    prisma.creditPackage.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.payment.findMany({ include: { user: { select: { phone: true } }, package: true }, orderBy: { createdAt: "desc" }, take: 100 }),
  ]);
  return (
    <div className="space-y-8">
      <section>
        <h1 className="mb-4 text-2xl font-bold text-espresso">بسته‌های اعتبار</h1>
        <div className="card divide-y divide-sand">
          {[...packages, null].map((p) => (
            <form key={p?.id ?? "new"} action={savePackage} className="grid items-end gap-2 p-4 sm:grid-cols-6">
              {p && <input type="hidden" name="id" value={p.id} />}
              <label className="sm:col-span-2"><span className="label text-xs">عنوان</span><input name="title" defaultValue={p?.title} required className="input py-2" /></label>
              <label><span className="label text-xs">تعداد پرو</span><input name="credits" type="number" defaultValue={p?.credits} required className="input py-2" /></label>
              <label><span className="label text-xs">قیمت (تومان)</span><input name="priceToman" type="number" defaultValue={p ? p.priceIrr / 10 : undefined} required className="input py-2" /></label>
              <label><span className="label text-xs">ترتیب</span><input name="sortOrder" type="number" defaultValue={p?.sortOrder ?? 0} className="input py-2" /></label>
              <div className="flex items-center gap-2">
                {p && <label className="flex items-center gap-1 text-xs"><input type="checkbox" name="active" defaultChecked={p.active} /> فعال</label>}
                <button className="btn-primary px-4 py-2 text-xs">{p ? "ذخیره" : "افزودن"}</button>
              </div>
            </form>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-4 text-xl font-bold text-espresso">پرداخت‌ها</h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream text-right text-xs text-muted">
              <tr><th className="p-3">تاریخ</th><th className="p-3">کاربر</th><th className="p-3">بسته</th><th className="p-3">مبلغ</th><th className="p-3">درگاه</th><th className="p-3">کد پیگیری</th><th className="p-3">وضعیت</th><th className="p-3" /></tr>
            </thead>
            <tbody className="divide-y divide-sand">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="p-3 text-xs text-muted">{formatFaDate(p.createdAt, true)}</td>
                  <td className="p-3" dir="ltr">{p.user.phone}</td>
                  <td className="p-3">{p.package.title} ({fa(p.credits)})</td>
                  <td className="p-3">{toman(p.amountIrr)}</td>
                  <td className="p-3">{p.gateway}</td>
                  <td className="p-3 text-xs" dir="ltr">{p.refNumber ?? "—"}</td>
                  <td className="p-3">{STATUS[p.status]}</td>
                  <td className="p-3">
                    {p.status === "PAID" && (
                      <form action={refundPaymentAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <button className="btn px-2 py-1 text-xs text-red-700 hover:bg-red-50">ثبت بازگشت وجه</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
