import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { MODE_LABELS, STATUS_LABELS, TYPE_LABELS } from "@/lib/gowns";

export default async function AdminGowns() {
  const gowns = await prisma.gown.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-espresso">لباس‌ها</h1>
        <Link href="/admin/gowns/new" className="btn-primary">افزودن لباس</Link>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream text-right text-xs text-muted">
            <tr><th className="p-3">تصویر</th><th className="p-3">نام</th><th className="p-3">نوع</th><th className="p-3">فروش/اجاره</th><th className="p-3">وضعیت</th><th className="p-3">ویژه</th><th className="p-3" /></tr>
          </thead>
          <tbody className="divide-y divide-sand">
            {gowns.map((g) => (
              <tr key={g.id}>
                <td className="p-3">
                  <div className="relative h-16 w-11 overflow-hidden rounded bg-cream">{g.images[0] && <Image src={g.images[0]} alt="" fill sizes="44px" className="object-cover" />}</div>
                </td>
                <td className="p-3 font-semibold">{g.name}</td>
                <td className="p-3">{TYPE_LABELS[g.type]}</td>
                <td className="p-3">{MODE_LABELS[g.mode]}</td>
                <td className="p-3">{STATUS_LABELS[g.status]}</td>
                <td className="p-3">{g.featured ? "✓" : ""}</td>
                <td className="p-3"><Link href={`/admin/gowns/${g.id}`} className="text-gold-dark underline">ویرایش</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
