import { prisma } from "@/lib/db";
import { getRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";

/** Liveness/readiness probe used by Docker and the load balancer. */
export async function GET() {
  const checks: Record<string, "ok" | "error"> = {};
  await Promise.all([
    prisma.$queryRaw`SELECT 1`.then(() => (checks.db = "ok")).catch(() => (checks.db = "error")),
    getRedis()
      .ping()
      .then(() => (checks.redis = "ok"))
      .catch(() => (checks.redis = "error")),
  ]);
  const ok = Object.values(checks).every((v) => v === "ok");
  return Response.json({ status: ok ? "ok" : "degraded", checks, time: new Date().toISOString() }, { status: ok ? 200 : 503 });
}
