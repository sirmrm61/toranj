import { prisma } from "@/lib/db";
import { handler, json } from "@/lib/http";

export const GET = handler(async () => {
  const items = await prisma.creditPackage.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  return json({ items: items.map((p) => ({ id: p.id, title: p.title, credits: p.credits, priceIrr: p.priceIrr })) });
});
