import type { Gown, Prisma } from "@/generated/prisma/client";
import type { GownMode, GownStyle, GownType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";

export const TYPE_LABELS: Record<GownType, string> = {
  BRIDAL: "لباس عروس",
  ENGAGEMENT: "لباس نامزدی",
  EVENING: "لباس مجلسی",
  BRIDESMAID: "لباس ساقدوش",
};

export const STYLE_LABELS: Record<GownStyle, string> = {
  PUFFY: "پفی",
  MERMAID: "ماهی",
  SIMPLE: "ساده",
  A_LINE: "A-line",
};

export const MODE_LABELS: Record<GownMode, string> = { SALE: "فروش", RENT: "اجاره", BOTH: "فروش و اجاره" };

export const STATUS_LABELS = { AVAILABLE: "موجود", SOLD: "فروخته‌شده", RENTED: "اجاره داده‌شده", HIDDEN: "مخفی" } as const;

export const TYPE_SLUGS: Record<string, GownType> = {
  bridal: "BRIDAL",
  engagement: "ENGAGEMENT",
  evening: "EVENING",
  bridesmaid: "BRIDESMAID",
};

export type GownFilters = {
  type?: GownType;
  style?: GownStyle;
  neckline?: string;
  sleeve?: string;
  color?: string;
  mode?: "SALE" | "RENT";
  page?: number;
};

const PAGE_SIZE = 12;

function pick<T extends string>(v: unknown, allowed: readonly T[]): T | undefined {
  return typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : undefined;
}

export function parseFilters(sp: Record<string, string | string[] | undefined>): GownFilters {
  const s = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).slice(0, 40) : undefined);
  return {
    type: pick(sp.type, Object.keys(TYPE_LABELS) as GownType[]) ?? (s("type") ? TYPE_SLUGS[s("type")!] : undefined),
    style: pick(sp.style, Object.keys(STYLE_LABELS) as GownStyle[]),
    neckline: s("neckline") || undefined,
    sleeve: s("sleeve") || undefined,
    color: s("color") || undefined,
    mode: pick(sp.mode, ["SALE", "RENT"] as const),
    page: Math.max(1, Number(s("page")) || 1),
  };
}

function where(f: GownFilters): Prisma.GownWhereInput {
  return {
    status: { not: "HIDDEN" },
    ...(f.type && { type: f.type }),
    ...(f.style && { style: f.style }),
    ...(f.neckline && { neckline: f.neckline }),
    ...(f.sleeve && { sleeve: f.sleeve }),
    ...(f.color && { color: f.color }),
    ...(f.mode && { mode: { in: [f.mode, "BOTH"] } }),
  };
}

export async function listGowns(f: GownFilters) {
  const page = f.page ?? 1;
  const [items, total] = await Promise.all([
    prisma.gown.findMany({
      where: where(f),
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.gown.count({ where: where(f) }),
  ]);
  return { items, total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

/** Distinct values for filter dropdowns. */
export async function filterOptions() {
  const rows = await prisma.gown.findMany({
    where: { status: { not: "HIDDEN" } },
    select: { neckline: true, sleeve: true, color: true },
  });
  const uniq = (xs: (string | null)[]) => [...new Set(xs.filter((x): x is string => !!x))].sort((a, b) => a.localeCompare(b, "fa"));
  return { necklines: uniq(rows.map((r) => r.neckline)), sleeves: uniq(rows.map((r) => r.sleeve)), colors: uniq(rows.map((r) => r.color)) };
}

export async function getGownBySlug(slug: string) {
  const gown = await prisma.gown.findUnique({ where: { slug } });
  return gown && gown.status !== "HIDDEN" ? gown : null;
}

export async function similarGowns(g: Gown, take = 4) {
  return prisma.gown.findMany({
    where: { id: { not: g.id }, status: { not: "HIDDEN" }, OR: [{ type: g.type }, { style: g.style }] },
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
    take,
  });
}

export async function featuredGowns(take = 6) {
  return prisma.gown.findMany({
    where: { status: { not: "HIDDEN" }, featured: true },
    orderBy: [{ sortOrder: "asc" }],
    take,
  });
}

export function gownUrl(g: Pick<Gown, "slug">) {
  return `/gowns/${encodeURIComponent(g.slug)}`;
}
