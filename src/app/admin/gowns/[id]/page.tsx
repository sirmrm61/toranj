import Link from "next/link";
import { notFound } from "next/navigation";
import { GownForm } from "@/components/admin/gown-form";
import { prisma } from "@/lib/db";
import { gownUrl } from "@/lib/gowns";

export default async function EditGown({ params, searchParams }: PageProps<"/admin/gowns/[id]">) {
  const { id } = await params;
  const { saved } = await searchParams;
  const gown = await prisma.gown.findUnique({ where: { id } });
  if (!gown) notFound();
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-espresso">ویرایش {gown.name}</h1>
        <Link href={gownUrl(gown)} className="text-sm text-gold-dark underline" target="_blank">مشاهده در سایت</Link>
      </div>
      {saved && <p className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">ذخیره شد.</p>}
      <GownForm gown={gown} />
    </div>
  );
}
