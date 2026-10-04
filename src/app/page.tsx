import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { GownCard } from "@/components/gowns/gown-card";
import { Hero } from "@/components/landing/hero";
import { ContactFab } from "@/components/site/contact-fab";
import { FaqList } from "@/components/site/faq-list";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { JsonLd } from "@/components/site/json-ld";
import { faqs, site, testimonials } from "@/content/site";
import type { GownType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { featuredGowns, TYPE_LABELS } from "@/lib/gowns";
import { faqLd, localBusinessLd } from "@/lib/seo";

export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: `${site.name} | لباس عروس، نامزدی و مجلسی در ${site.city}` },
  description: site.description,
  alternates: { canonical: "/" },
};

const TYPES: GownType[] = ["BRIDAL", "ENGAGEMENT", "EVENING", "BRIDESMAID"];

const WHY = [
  { t: "دوخت اختصاصی", d: "طراحی و دوخت بر اساس اندام و سلیقه شما، با پارچه‌های درجه‌یک." },
  { t: "خرید یا اجاره", d: "بسیاری از مدل‌ها با قیمت شفاف، هم برای خرید و هم برای اجاره." },
  { t: "پرو آنلاین", d: "پیش از مراجعه، لباس‌ها را روی عکس خودتان ببینید؛ ۳ پرو اول رایگان." },
  { t: "همراهی تا روز مراسم", d: "اصلاحات، پرو نهایی و آماده‌سازی لباس پیش از مراسم." },
];

export default async function Home() {
  const [featured, typeCovers] = await Promise.all([
    featuredGowns(8),
    Promise.all(TYPES.map((t) => prisma.gown.findFirst({ where: { type: t, status: { not: "HIDDEN" } }, orderBy: [{ featured: "desc" }, { sortOrder: "asc" }] }))),
  ]).catch(() => [[], TYPES.map(() => null)] as const);
  return (
    <>
      <JsonLd data={[localBusinessLd(), faqLd(faqs.slice(0, 5))]} />
      <Header overlay />
      <main className="flex-1">
        <Hero />

        <section className="container-x py-20">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">کالکشن ترنج</p>
              <h2 className="section-title mt-2">مدل‌های منتخب</h2>
            </div>
            <Link href="/gowns" className="btn-outline">همه مدل‌ها</Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {featured.map((g) => (
              <GownCard key={g.id} gown={g} />
            ))}
          </div>
        </section>

        <section className="bg-cream/60 py-20">
          <div className="container-x">
            <h2 className="section-title mb-10 text-center">دسته‌بندی‌ها</h2>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {TYPES.map((t, i) => {
                const cover = typeCovers[i]?.images[0];
                return (
                  <Link key={t} href={`/gowns?type=${t}`} className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-sand">
                    {cover && <Image src={cover} alt={TYPE_LABELS[t]} fill sizes="(max-width:1024px) 50vw, 25vw" className="object-cover transition duration-700 group-hover:scale-105" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className="absolute bottom-5 right-5 text-xl font-bold text-white">{TYPE_LABELS[t]}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="container-x grid items-center gap-12 py-20 lg:grid-cols-2">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl">
            <Image src="/gowns-media/setareh-1.webp" alt="پرو آنلاین لباس عروس" fill sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
            <span className="absolute top-5 right-5 rounded-full bg-gold px-4 py-1.5 text-sm font-bold text-white">۳ پرو رایگان</span>
          </div>
          <div>
            <p className="eyebrow">پرو آنلاین با هوش مصنوعی</p>
            <h2 className="section-title mt-2">قبل از آمدن به مزون، لباس را روی خودتان ببینید</h2>
            <p className="mt-4 leading-8 text-muted">
              یک عکس تمام‌قد بفرستید و مدل دلخواهتان را انتخاب کنید؛ کمتر از یک دقیقه بعد تصویرتان با لباس آماده است. با دعوت از دوستان، پروهای رایگان بیشتری بگیرید.
            </p>
            <ol className="mt-6 space-y-3 text-sm text-cocoa">
              <li>۱. ورود با شماره موبایل</li>
              <li>۲. انتخاب لباس از گالری</li>
              <li>۳. ارسال عکس و دیدن نتیجه</li>
              <li>۴. رزرو پرو حضوری برای مدل‌های محبوب</li>
            </ol>
            <div className="mt-8 flex gap-3">
              <Link href="/tryon" className="btn-gold py-4">شروع پرو آنلاین</Link>
              <Link href="/booking" className="btn-outline py-4">رزرو وقت حضوری</Link>
            </div>
            <p className="mt-4 text-xs text-muted">{site.tryonDisclaimer}</p>
          </div>
        </section>

        <section className="bg-espresso py-20 text-white">
          <div className="container-x">
            <h2 className="mb-12 text-center text-3xl font-black">چرا ترنج؟</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {WHY.map((w) => (
                <div key={w.t} className="rounded-2xl border border-white/10 p-6">
                  <p className="text-lg font-bold text-gold-light">{w.t}</p>
                  <p className="mt-2 text-sm leading-7 text-white/70">{w.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container-x py-20">
          <h2 className="section-title mb-10 text-center">تجربه عروس‌های ترنج</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure key={t.name} className="card p-6">
                <blockquote className="leading-8 text-cocoa">«{t.text}»</blockquote>
                <figcaption className="mt-4 text-sm font-semibold text-gold-dark">{t.name}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="bg-cream/60 py-20">
          <div className="container-x grid gap-12 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <h2 className="section-title">سوالات متداول</h2>
              <p className="mt-3 text-muted">پاسخ سوال‌تان را پیدا نکردید؟ در واتس‌اپ از ما بپرسید.</p>
              <Link href="/faq" className="btn-outline mt-6">همه سوالات</Link>
            </div>
            <FaqList items={faqs.slice(0, 5)} />
          </div>
        </section>

        <section className="container-x py-20">
          <div className="card grid gap-8 overflow-hidden p-8 sm:p-12 lg:grid-cols-2">
            <div>
              <h2 className="section-title">به مزون ترنج سر بزنید</h2>
              <p className="mt-4 leading-8 text-muted">{site.address}</p>
              <p className="mt-2 text-sm text-muted">{site.transit}</p>
              <ul className="mt-4 space-y-1 text-sm">
                {site.hours.map((h) => (
                  <li key={h.days}><span className="text-muted">{h.days}:</span> {h.time}</li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col justify-center gap-3">
              <Link href="/booking" className="btn-gold py-4 text-base">رزرو وقت پرو حضوری</Link>
              <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener" className="btn-outline py-4">گفتگو در واتس‌اپ</a>
              <a href={`tel:${site.phone}`} className="btn-outline py-4">تماس: {site.phoneDisplay}</a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <ContactFab />
    </>
  );
}
