import { TryonStudio } from "@/components/account/tryon-studio";
import { getAccountSummary } from "@/lib/account";
import { requirePageUser } from "@/lib/auth/page";
import { prisma } from "@/lib/db";

export default async function TryonPage({ searchParams }: PageProps<"/account/tryon">) {
  const user = await requirePageUser("/account/tryon");
  const { gown } = await searchParams;
  const [s, gowns] = await Promise.all([
    getAccountSummary(user),
    prisma.gown.findMany({
      where: { status: { not: "HIDDEN" } },
      select: { id: true, slug: true, name: true, images: true },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
    }),
  ]);
  const initial = gowns.find((g) => g.slug === (typeof gown === "string" ? decodeURIComponent(gown) : ""))?.id;
  return (
    <TryonStudio
      gowns={gowns.map((g) => ({ id: g.id, slug: g.slug, name: g.name, image: g.images[0] ?? null }))}
      initialGownId={initial}
      balances={s.balances}
    />
  );
}
