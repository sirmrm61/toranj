import type { Prisma } from "@/generated/prisma/client";
import { prisma, type Tx } from "./db";

export async function audit(action: string, actor: string | null, meta?: Prisma.InputJsonValue, tx?: Tx) {
  const client = tx ?? prisma;
  await client.auditLog.create({ data: { action, actor, meta } });
}
