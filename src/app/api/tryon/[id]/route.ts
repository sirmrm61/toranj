import { requireUser } from "@/lib/auth/session";
import { handler, json } from "@/lib/http";
import { deleteTryon, getOwnJob, serializeJob } from "@/lib/tryon";

export const GET = handler(async (_req: Request, ctx: RouteContext<"/api/tryon/[id]">) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  return json(serializeJob(await getOwnJob(user, id)), { headers: { "Cache-Control": "private, no-store" } });
});

export const DELETE = handler(async (_req: Request, ctx: RouteContext<"/api/tryon/[id]">) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  await deleteTryon(user, id);
  return json({ ok: true });
});
