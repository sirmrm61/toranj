import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { site } from "@/content/site";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "پرو آنلاین لباس عروس با هوش مصنوعی",
  description: "لباس‌های مزون ترنج را روی عکس خودتان ببینید؛ ۳ پرو اول رایگان.",
  alternates: { canonical: "/tryon" },
};

const STEPS = [
  { t: "وارد شوید", d: "با شماره موبایل ثبت‌نام کنید و ۳ پرو رایگان بگیرید." },
  { t: "لباس را انتخاب کنید", d: "از گالری، مدل موردعلاقه‌تان را انتخاب کنید." },
  { t: "عکس تمام‌قد بفرستید", d: "یک عکس روشن و تمام‌قد، رو به دوربین." },
  { t: "نتیجه را ببینید", d: "حدود یک دقیقه بعد تصویر شما با لباس آماده است." },
];

export default async function TryonLanding({ searchParams }: PageProps<"/tryon">) {
  const { gown } = await searchParams;
  const target = `/account/tryon${typeof gown === "string" ? `?gown=${encodeURIComponent(gown)}` : ""}`;
  if (await getCurrentUser()) redirect(target);
  return (
    <div className="container-x py-12">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <p className="eyebrow">پرو آنلاین</p>
          <h1 className="section-title mt-2">لباس عروس رویایی‌تان را روی خودتان ببینید</h1>
          <p className="mt-4 leading-8 text-muted">
            با هوش مصنوعی، مدل‌های مزون ترنج را روی عکس خودتان امتحان کنید. ۳ پرو اول رایگان است و با دعوت از دوستان پرو رایگان بیشتری می‌گیرید.
          </p>
          <ol className="mt-8 space-y-4">
            {STEPS.map((s, i) => (
              <li key={s.t} className="flex gap-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold/15 font-bold text-gold-dark">{(i + 1).toLocaleString("fa-IR")}</span>
                <div>
                  <p className="font-semibold text-espresso">{s.t}</p>
                  <p className="text-sm text-muted">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex gap-3">
            <Link href={`/login?next=${encodeURIComponent(target)}`} className="btn-gold py-4">شروع پرو رایگان</Link>
            <Link href="/gowns" className="btn-outline py-4">دیدن مدل‌ها</Link>
          </div>
          <p className="mt-4 text-xs text-muted">{site.tryonDisclaimer}</p>
        </div>
        <div className="relative aspect-[2/3] max-h-[640px] overflow-hidden rounded-3xl">
          <Image src="/gowns-media/morvarid-1.webp" alt="نمونه پرو آنلاین" fill sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" priority />
        </div>
      </div>
    </div>
  );
}
