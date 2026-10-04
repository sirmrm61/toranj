import type { Metadata } from "next";
import Link from "next/link";
import { GownCard } from "@/components/gowns/gown-card";
import { JsonLd } from "@/components/site/json-ld";
import { fa } from "@/lib/format";
import { filterOptions, listGowns, MODE_LABELS, parseFilters, STYLE_LABELS, TYPE_LABELS } from "@/lib/gowns";
import { breadcrumbLd } from "@/lib/seo";

export async function generateMetadata({ searchParams }: PageProps<"/gowns">): Promise<Metadata> {
  const f = parseFilters(await searchParams);
  const title = f.type ? `مدل‌های ${TYPE_LABELS[f.type]}` : "گالری لباس عروس، نامزدی و مجلسی";
  return {
    title,
    description: `${title} مزون ترنج؛ فیلتر بر اساس مدل، یقه، آستین، رنگ و امکان خرید یا اجاره.`,
    alternates: { canonical: f.type ? `/gowns?type=${f.type}` : "/gowns" },
  };
}

function Select({ name, label, value, options }: { name: string; label: string; value?: string; options: [string, string][] }) {
  return (
    <label className="block">
      <span className="label text-xs">{label}</span>
      <select name={name} defaultValue={value ?? ""} className="input py-2.5">
        <option value="">همه</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

export default async function GalleryPage({ searchParams }: PageProps<"/gowns">) {
  const sp = await searchParams;
  const f = parseFilters(sp);
  const [{ items, total, page, pages }, opts] = await Promise.all([listGowns(f), filterOptions()]);
  const qs = (p: number) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries(f)) if (v && k !== "page") u.set(k, String(v));
    if (p > 1) u.set("page", String(p));
    const s = u.toString();
    return s ? `/gowns?${s}` : "/gowns";
  };

  return (
    <div className="container-x py-10">
      <JsonLd data={breadcrumbLd([{ name: "خانه", path: "/" }, { name: "گالری", path: "/gowns" }])} />
      <header className="mb-8">
        <p className="eyebrow">کالکشن ترنج</p>
        <h1 className="section-title mt-2">{f.type ? `مدل‌های ${TYPE_LABELS[f.type]}` : "گالری لباس‌ها"}</h1>
        <nav className="mt-5 flex flex-wrap gap-2" aria-label="دسته‌بندی">
          <Link href="/gowns" className={`badge px-4 py-2 ${!f.type ? "bg-espresso text-white" : ""}`}>همه</Link>
          {Object.entries(TYPE_LABELS).map(([k, l]) => (
            <Link key={k} href={`/gowns?type=${k}`} className={`badge px-4 py-2 ${f.type === k ? "bg-espresso text-white" : ""}`}>
              {l}
            </Link>
          ))}
        </nav>
      </header>

      <form method="get" className="card mb-8 grid grid-cols-2 gap-3 p-4 md:grid-cols-6">
        {f.type && <input type="hidden" name="type" value={f.type} />}
        <Select name="style" label="مدل" value={f.style} options={Object.entries(STYLE_LABELS)} />
        <Select name="neckline" label="یقه" value={f.neckline} options={opts.necklines.map((x) => [x, x])} />
        <Select name="sleeve" label="آستین" value={f.sleeve} options={opts.sleeves.map((x) => [x, x])} />
        <Select name="color" label="رنگ" value={f.color} options={opts.colors.map((x) => [x, x])} />
        <Select name="mode" label="خرید / اجاره" value={f.mode} options={[["SALE", MODE_LABELS.SALE], ["RENT", MODE_LABELS.RENT]]} />
        <div className="col-span-2 flex items-end gap-2 md:col-span-1">
          <button className="btn-primary w-full py-2.5">اعمال فیلتر</button>
          <Link href={f.type ? `/gowns?type=${f.type}` : "/gowns"} className="btn-outline px-3 py-2.5" aria-label="حذف فیلترها">
            ×
          </Link>
        </div>
      </form>

      <p className="mb-4 text-sm text-muted">{fa(total)} مدل</p>
      {items.length === 0 ? (
        <div className="card p-10 text-center text-muted">
          مدلی با این فیلترها پیدا نشد. <Link href="/gowns" className="text-gold-dark underline">همه مدل‌ها</Link> را ببینید.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {items.map((g, i) => (
            <GownCard key={g.id} gown={g} priority={i < 4} />
          ))}
        </div>
      )}

      {pages > 1 && (
        <nav className="mt-10 flex justify-center gap-2" aria-label="صفحه‌بندی">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={qs(p)} className={`grid h-10 w-10 place-items-center rounded-full ${p === page ? "bg-espresso text-white" : "bg-white ring-1 ring-sand"}`}>
              {fa(p)}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
