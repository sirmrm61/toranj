import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { gownUrl } from "@/lib/gowns";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.appUrl;
  const statics = ["", "/gowns", "/booking", "/tryon", "/about", "/faq", "/contact", "/privacy", "/terms"].map((p) => ({
    url: `${base}${p}`,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.7,
  }));
  const types = ["BRIDAL", "ENGAGEMENT", "EVENING", "BRIDESMAID"].map((t) => ({ url: `${base}/gowns?type=${t}`, priority: 0.8 }));
  const gowns = await prisma.gown
    .findMany({ where: { status: { not: "HIDDEN" } }, select: { slug: true, updatedAt: true, images: true } })
    .catch(() => []);
  return [
    ...statics,
    ...types,
    ...gowns.map((g) => ({ url: `${base}${gownUrl(g)}`, lastModified: g.updatedAt, priority: 0.9, images: g.images.map((i) => `${base}${i}`) })),
  ];
}
