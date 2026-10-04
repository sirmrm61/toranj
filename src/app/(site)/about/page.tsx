import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { site, testimonials } from "@/content/site";

export const metadata: Metadata = {
  title: "درباره ما",
  description: "داستان مزون ترنج، تیم طراحی و شیوه کار ما در دوخت و اجاره لباس عروس.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="container-x py-12">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <p className="eyebrow">درباره ترنج</p>
          <h1 className="section-title mt-2">ده سال همراهی با عروس‌ها</h1>
          <div className="mt-6 space-y-4 leading-8 text-ink/80">
            <p>
              {site.name} با یک هدف ساده شروع شد: هر عروس لباسی بپوشد که حس کند برای خودش دوخته شده است. تیم ما از طراحی و
              انتخاب پارچه تا آخرین پرو کنار شماست.
            </p>
            <p>
              لباس‌ها را می‌توانید خریداری کنید، سفارش دوخت اختصاصی بدهید یا برای مراسم اجاره کنید. قبل از آمدن به مزون هم
              می‌توانید با پرو آنلاین، مدل‌ها را روی عکس خودتان ببینید.
            </p>
          </div>
          <div className="mt-8 flex gap-3">
            <Link href="/booking" className="btn-primary">رزرو وقت پرو</Link>
            <Link href="/gowns" className="btn-outline">دیدن کالکشن</Link>
          </div>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
          <Image src="/landing/poster.webp" alt="فضای مزون ترنج" fill sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
        </div>
      </div>
      <section className="mt-16 grid gap-6 md:grid-cols-3">
        {testimonials.map((t) => (
          <figure key={t.name} className="card p-6">
            <blockquote className="text-sm leading-7 text-ink/80">«{t.text}»</blockquote>
            <figcaption className="mt-4 text-xs font-semibold text-gold-dark">{t.name}</figcaption>
          </figure>
        ))}
      </section>
    </div>
  );
}
