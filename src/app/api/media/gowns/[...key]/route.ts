import { storage } from "@/lib/storage";

/** Public gown photos uploaded from the admin panel (stored under the gowns/ prefix only). */
export async function GET(_req: Request, ctx: RouteContext<"/api/media/gowns/[...key]">) {
  const { key } = await ctx.params;
  const name = key.join("/");
  if (!/^[\w.-]+$/.test(name)) return new Response("Not found", { status: 404 });
  const obj = await storage.get(`gowns/${name}`);
  if (!obj) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(obj.body), {
    headers: { "Content-Type": obj.contentType, "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
