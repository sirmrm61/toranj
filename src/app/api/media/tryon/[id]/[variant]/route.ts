import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { storage } from "@/lib/storage";
import { verifyTryonSignature, type TryonVariant } from "@/lib/storage/signed";

const NO_STORE = { "Cache-Control": "private, no-store, max-age=0", "X-Robots-Tag": "noindex" };

export async function GET(req: Request, ctx: RouteContext<"/api/media/tryon/[id]/[variant]">) {
  const { id, variant } = await ctx.params;
  if (variant !== "preview" && variant !== "full") return new Response("Not found", { status: 404 });
  const url = new URL(req.url);
  const exp = Number(url.searchParams.get("exp"));
  const sig = url.searchParams.get("sig") ?? "";

  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401, headers: NO_STORE });
  if (!verifyTryonSignature(id, variant as TryonVariant, user.id, exp, sig)) {
    return new Response("Link expired", { status: 403, headers: NO_STORE });
  }

  const job = await prisma.tryonJob.findUnique({ where: { id } });
  if (!job || job.userId !== user.id || job.status !== "done") return new Response("Not found", { status: 404, headers: NO_STORE });
  // Full-quality images exist only for paid try-ons; free ones only expose the watermarked preview (FR-16/17).
  const key = variant === "full" ? (job.bucketUsed === "paid" ? job.resultKey : null) : job.previewKey;
  if (!key) return new Response("Forbidden", { status: 403, headers: NO_STORE });

  const obj = await storage.get(key);
  if (!obj) return new Response("Not found", { status: 404, headers: NO_STORE });

  const download = variant === "full" && url.searchParams.get("download") === "1";
  return new Response(new Uint8Array(obj.body), {
    headers: {
      ...NO_STORE,
      "Content-Type": "image/jpeg",
      "Content-Disposition": download ? `attachment; filename="toranj-tryon-${id.slice(0, 8)}.jpg"` : "inline",
    },
  });
}
