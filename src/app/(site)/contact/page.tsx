import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/site/json-ld";
import { site } from "@/content/site";
import { whatsappLink } from "@/lib/format";
import { localBusinessLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "تماس با ما و آدرس مزون",
  description: `آدرس، ساعات کاری و راه‌های تماس با ${site.name}.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const { lat, lng } = site.geo;
  const bbox = `${lng - 0.006},${lat - 0.004},${lng + 0.006},${lat + 0.004}`;
  return (
    <div className="container-x py-12">
      <JsonLd data={localBusinessLd()} />
      <p className="eyebrow">در تماس باشید</p>
      <h1 className="section-title mt-2 mb-8">تماس با ما</h1>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="font-bold text-espresso">آدرس</h2>
            <p className="mt-2 text-sm leading-7">{site.address}</p>
            <p className="mt-1 text-xs text-muted">{site.transit}</p>
            <a className="mt-3 inline-block text-sm text-gold-dark underline" target="_blank" rel="noopener" href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}>
              مسیریابی
            </a>
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
          <div className="card flex flex-wrap gap-3 p-6">
            <a href={`tel:${site.phone}`} className="btn-primary">تماس: <span dir="ltr">{site.phoneDisplay}</span></a>
            <a href={whatsappLink(site.whatsapp)} target="_blank" rel="noopener" className="btn-outline">واتس‌اپ</a>
            <a href={`https://t.me/${site.telegram}`} target="_blank" rel="noopener" className="btn-outline">تلگرام</a>
            <a href={`https://instagram.com/${site.instagram}`} target="_blank" rel="noopener" className="btn-outline">اینستاگرام</a>
            <Link href="/booking" className="btn-gold">رزرو وقت پرو</Link>
          </div>
        </div>
        <iframe
          title="نقشه مزون ترنج"
          className="h-[420px] w-full rounded-2xl border border-sand"
          loading="lazy"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`}
        />
      </div>
    </div>
  );
}
