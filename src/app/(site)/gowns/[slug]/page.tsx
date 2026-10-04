import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GownCard } from "@/components/gowns/gown-card";
import { GownGallery } from "@/components/gowns/gown-gallery";
import { JsonLd } from "@/components/site/json-ld";
import { site } from "@/content/site";
import { whatsappLink } from "@/lib/format";
import { getGownBySlug, gownUrl, MODE_LABELS, similarGowns, STATUS_LABELS, STYLE_LABELS, TYPE_LABELS } from "@/lib/gowns";
import { breadcrumbLd, productLd } from "@/lib/seo";

async function load(params: PageProps<"/gowns/[slug]">["params"]) {
  const { slug } = await params;
  return getGownBySlug(decodeURIComponent(slug));
}

export async function generateMetadata({ params }: PageProps<"/gowns/[slug]">): Promise<Metadata> {
  const g = await load(params);
  if (!g) return { title: "مدل پیدا نشد" };
  const title = `${TYPE_LABELS[g.type]} ${g.name} - ${STYLE_LABELS[g.style]}`;
  return {
    title,
    description: `${g.tagline ?? ""} ${g.description}`.slice(0, 160),
    alternates: { canonical: gownUrl(g) },
    openGraph: { title, images: g.images.slice(0, 1) },
  };
}

export default async function GownPage({ params }: PageProps<"/gowns/[slug]">) {
  const g = await load(params);
  if (!g) notFound();
  const similar = await similarGowns(g);
  const alt = `${TYPE_LABELS[g.type]} مدل ${g.name}`;
  const specs: [string, string | null][] = [
    ["نوع", TYPE_LABELS[g.type]],
    ["مدل", STYLE_LABELS[g.style]],
    ["یقه", g.neckline],
    ["آستین", g.sleeve],
    ["رنگ", g.color],
    ["پارچه", g.fabric],
    ["خرید / اجاره", MODE_LABELS[g.mode]],
    ["وضعیت", STATUS_LABELS[g.status]],
    ["محدوده قیمت", g.priceRange],
  ];

  return (
    <div className="container-x py-10">
      <JsonLd
        data={[
          productLd(g),
          breadcrumbLd([
            { name: "خانه", path: "/" },
            { name: "گالری", path: "/gowns" },
            { name: TYPE_LABELS[g.type], path: `/gowns?type=${g.type}` },
            { name: g.name, path: gownUrl(g) },
          ]),
        ]}
      />
      <nav className="mb-6 text-xs text-muted" aria-label="مسیر">
        <Link href="/" className="hover:text-gold-dark">خانه</Link> / <Link href="/gowns" className="hover:text-gold-dark">گالری</Link> /{" "}
        <Link href={`/gowns?type=${g.type}`} className="hover:text-gold-dark">{TYPE_LABELS[g.type]}</Link> / <span className="text-espresso">{g.name}</span>
      </nav>
      <div className="grid gap-10 lg:grid-cols-2">
        <GownGallery images={g.images} alt={alt} />
        <div>
          <p className="eyebrow">{TYPE_LABELS[g.type]}</p>
          <h1 className="mt-2 text-3xl font-extrabold text-espresso sm:text-4xl">{g.name}</h1>
          {g.tagline && <p className="mt-3 text-lg text-cocoa">{g.tagline}</p>}
          <p className="mt-6 leading-8 text-ink/80">{g.description}</p>
          <dl className="card mt-8 grid grid-cols-2 gap-x-6 gap-y-4 p-6 text-sm">
            {specs
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k}>
                  <dt className="text-muted">{k}</dt>
                  <dd className="mt-0.5 font-semibold text-espresso">{v}</dd>
                </div>
              ))}
          </dl>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={`/booking?gown=${encodeURIComponent(g.slug)}`} className="btn-primary flex-1 py-4 text-base">
              رزرو وقت پرو حضوری
            </Link>
            <Link href={`/tryon?gown=${encodeURIComponent(g.slug)}`} className="btn-gold flex-1 py-4 text-base">
              پرو آنلاین این لباس
            </Link>
          </div>
          <a
            href={whatsappLink(site.whatsapp, `سلام، درباره مدل «${g.name}» سوال دارم.`)}
            target="_blank"
            rel="noopener"
            className="btn-outline mt-3 w-full"
          >
            سوال درباره این مدل در واتس‌اپ
          </a>
          <p className="mt-4 text-xs text-muted">{site.tryonDisclaimer}</p>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-20">
          <h2 className="section-title mb-6">مدل‌های مشابه</h2>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
            {similar.map((s) => (
              <GownCard key={s.id} gown={s} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
