import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { catalog, gownImagePaths } from "../src/content/catalog";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const packages = [
  { title: "بسته برنزی", credits: 5, priceIrr: 1_500_000, sortOrder: 1 },
  { title: "بسته نقره‌ای", credits: 12, priceIrr: 3_000_000, sortOrder: 2 },
  { title: "بسته طلایی", credits: 30, priceIrr: 6_000_000, sortOrder: 3 },
];

async function main() {
  for (const [i, g] of catalog.entries()) {
    const images = gownImagePaths(g.key);
    const data = {
      name: g.name,
      tagline: g.tagline,
      description: g.description,
      fabric: g.fabric,
      type: g.type,
      style: g.style,
      neckline: g.neckline,
      sleeve: g.sleeve,
      color: g.color,
      mode: g.mode,
      priceRange: g.priceRange,
      featured: g.featured,
      images,
      tryonRefs: [images[0]],
      sortOrder: i,
    };
    await prisma.gown.upsert({ where: { slug: g.slug }, create: { slug: g.slug, ...data }, update: data });
  }

  if ((await prisma.creditPackage.count()) === 0) await prisma.creditPackage.createMany({ data: packages });

  console.info(`Seeded ${catalog.length} gowns and ${packages.length} credit packages.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
