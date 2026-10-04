import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { handler, json } from "@/lib/http";
import { maskPhone } from "@/lib/phone";

export const GET = handler(async () => {
  const user = await requireUser();
  const items = await prisma.referral.findMany({
    where: { inviterId: user.id },
    include: { invitee: { select: { phone: true } } },
    orderBy: { createdAt: "desc" },
  });
  return json({
    items: items.map((r) => ({ id: r.id, status: r.status, invitee: maskPhone(r.invitee.phone), createdAt: r.createdAt })),
  });
});
