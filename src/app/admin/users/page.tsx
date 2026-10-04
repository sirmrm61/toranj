import { adjustCredits, toggleBlock } from "@/app/admin/actions";
import { sumBalances } from "@/lib/credits/balance";
import { prisma } from "@/lib/db";
import { fa } from "@/lib/format";
import { formatFaDate } from "@/lib/jalali";
import { toLatinDigits } from "@/lib/phone";

export default async function AdminUsers({ searchParams }: PageProps<"/admin/users">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? toLatinDigits(q.trim()) : "";
  const users = await prisma.user.findMany({
    where: query ? { OR: [{ phone: { contains: query } }, { referralCode: { equals: query.toUpperCase() } }] } : {},
    include: { ledger: { select: { bucket: true, amount: true } }, _count: { select: { tryons: true, invited: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-espresso">کاربران</h1>
      <form className="mb-4 flex gap-2">
        <input name="q" defaultValue={query} placeholder="جستجوی موبایل یا کد دعوت" className="input max-w-sm" />
        <button className="btn-primary">جستجو</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream text-right text-xs text-muted">
            <tr><th className="p-3">موبایل</th><th className="p-3">عضویت</th><th className="p-3">اعتبار (رایگان/پولی)</th><th className="p-3">پروها</th><th className="p-3">دعوت‌ها</th><th className="p-3">اصلاح اعتبار</th><th className="p-3">وضعیت</th></tr>
          </thead>
          <tbody className="divide-y divide-sand">
            {users.map((u) => {
              const b = sumBalances(u.ledger);
              return (
                <tr key={u.id} className={u.blocked ? "bg-red-50/60" : ""}>
                  <td className="p-3" dir="ltr">{u.phone} {u.role === "ADMIN" && <span className="badge">admin</span>}</td>
                  <td className="p-3 text-xs text-muted">{formatFaDate(u.createdAt)}</td>
                  <td className="p-3">{fa(b.free)} / {fa(b.paid)}</td>
                  <td className="p-3">{fa(u._count.tryons)}</td>
                  <td className="p-3">{fa(u._count.invited)} <span className="text-xs text-muted" dir="ltr">({u.referralCode})</span></td>
                  <td className="p-3">
                    <form action={adjustCredits} className="flex gap-1">
                      <input type="hidden" name="id" value={u.id} />
                      <input name="amount" type="number" required placeholder="±" className="input w-16 px-2 py-1.5 text-xs" />
                      <select name="bucket" className="input w-20 px-2 py-1.5 text-xs"><option value="free">رایگان</option><option value="paid">پولی</option></select>
                      <input name="note" placeholder="دلیل" className="input w-24 px-2 py-1.5 text-xs" />
                      <button className="btn-outline px-2 py-1 text-xs">ثبت</button>
                    </form>
                  </td>
                  <td className="p-3">
                    <form action={toggleBlock}>
                      <input type="hidden" name="id" value={u.id} />
                      <button className={`btn px-3 py-1 text-xs ${u.blocked ? "text-emerald-700" : "text-red-700"}`}>{u.blocked ? "رفع مسدودیت" : "مسدود"}</button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
