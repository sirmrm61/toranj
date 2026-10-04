import type { Gown } from "@/generated/prisma/client";
import { faqs, site } from "@/content/site";
import { env } from "@/lib/env";
import { gownUrl, TYPE_LABELS } from "@/lib/gowns";

export const abs = (p: string) => (p.startsWith("http") ? p : `${env.appUrl}${p}`);

export function localBusinessLd() {
  return {
    "@context": "https://schema.org",
    "@type": "BridalShop",
    "@id": `${env.appUrl}/#business`,
    name: site.name,
    description: site.description,
    url: env.appUrl,
    telephone: site.phone,
    image: abs("/landing/poster.webp"),
    priceRange: "$$$",
    address: { "@type": "PostalAddress", streetAddress: site.address, addressLocality: site.city, addressCountry: "IR" },
    geo: { "@type": "GeoCoordinates", latitude: site.geo.lat, longitude: site.geo.lng },
    openingHoursSpecification: site.openingHoursSpec.map((o) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: o.days,
      opens: o.opens,
      closes: o.closes,
    })),
    sameAs: [`https://instagram.com/${site.instagram}`, `https://t.me/${site.telegram}`],
  };
}

export function faqLd(items = faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: abs(it.path) })),
  };
}

export function productLd(g: Gown) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${TYPE_LABELS[g.type]} ${g.name}`,
    description: g.description,
    image: g.images.map(abs),
    url: abs(gownUrl(g)),
    brand: { "@type": "Brand", name: site.name },
    color: g.color,
    material: g.fabric ?? undefined,
    category: TYPE_LABELS[g.type],
    offers: {
      "@type": "Offer",
      availability: g.status === "AVAILABLE" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      priceCurrency: "IRR",
      seller: { "@id": `${env.appUrl}/#business` },
      url: abs(gownUrl(g)),
    },
  };
}
