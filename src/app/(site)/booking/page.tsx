import type { Metadata } from "next";
import { BookingForm } from "@/components/forms/booking-form";
import { site } from "@/content/site";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "رزرو وقت پرو حضوری",
  description: "رزرو آنلاین وقت پرو لباس عروس در مزون ترنج؛ فقط در کمتر از یک دقیقه.",
  alternates: { canonical: "/booking" },
};

export default async function BookingPage({ searchParams }: PageProps<"/booking">) {
  const { gown } = await searchParams;
  const gowns = await prisma.gown.findMany({ where: { status: { not: "HIDDEN" } }, select: { slug: true, name: true }, orderBy: { sortOrder: "asc" } });
  return (
    <div className="container-x grid gap-10 py-12 lg:grid-cols-[1fr_380px]">
      <div>
        <p className="eyebrow">پرو حضوری</p>
        <h1 className="section-title mt-2 mb-2">رزرو وقت پرو</h1>
        <p className="mb-8 text-muted">فرم زیر را پر کنید تا برای هماهنگی نهایی با شما تماس بگیریم.</p>
        <BookingForm gowns={gowns} defaultGown={typeof gown === "string" ? gown : undefined} />
      </div>
      <aside className="space-y-4">
        <div className="card p-6">
          <h2 className="font-bold text-espresso">آدرس مزون</h2>
          <p className="mt-2 text-sm leading-7 text-muted">{site.address}</p>
          <p className="mt-2 text-xs text-muted">{site.transit}</p>
        </div>
        <div className="card p-6">
          <h2 className="font-bold text-espresso">ساعات کاری</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {site.hours.map((h) => (
              <li key={h.days} className="flex justify-between">
                <span className="text-muted">{h.days}</span>
                <span>{h.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
