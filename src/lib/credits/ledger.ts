import type { Prisma } from "@/generated/prisma/client";
import type { CreditBucket } from "@/generated/prisma/enums";
import { prisma, type Tx } from "@/lib/db";
import { HttpError } from "@/lib/http";
import { pickBucket, sumBalances, type Balances } from "./balance";

export { pickBucket, sumBalances, type Balances };

/** Serializes credit operations of one user (SELECT ... FOR UPDATE on the user row). */
export async function lockUser(tx: Tx, userId: string) {
  await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
}

export async function getBalances(userId: string, tx?: Tx): Promise<Balances> {
  const client = tx ?? prisma;
  const groups = await client.creditLedger.groupBy({ by: ["bucket"], where: { userId }, _sum: { amount: true } });
  return sumBalances(groups.map((g) => ({ bucket: g.bucket, amount: g._sum.amount ?? 0 })));
}

/** Total free credits ever granted (signup quota + referral gifts) — used for "x of y free try-ons left". */
export async function getFreeGranted(userId: string): Promise<number> {
  const r = await prisma.creditLedger.aggregate({
    where: { userId, bucket: "free", type: { in: ["free_signup", "referral_bonus"] } },
    _sum: { amount: true },
  });
  return r._sum.amount ?? 0;
}

/** Inserts a ledger row once per idempotency key; returns the existing row on repeat calls. */
export async function insertLedgerOnce(tx: Tx, data: Prisma.CreditLedgerUncheckedCreateInput) {
  const existing = await tx.creditLedger.findUnique({ where: { idempotencyKey: data.idempotencyKey } });
  if (existing) return { row: existing, created: false };
  const row = await tx.creditLedger.create({ data });
  return { row, created: true };
}

/**
 * Reserves one credit for a try-on job (TRD §6). Must run inside a transaction.
 * Throws 402 when the user has no credit left.
 */
export async function reserveCredit(tx: Tx, userId: string, jobId: string): Promise<CreditBucket> {
  await lockUser(tx, userId);
  const bucket = pickBucket(await getBalances(userId, tx));
  if (!bucket) throw new HttpError(402, "اعتبار شما تمام شده است؛ برای ادامه حساب را شارژ کنید.", "no_credit");
  await insertLedgerOnce(tx, {
    userId,
    type: "consume",
    amount: -1,
    bucket,
    refId: jobId,
    idempotencyKey: `consume:job:${jobId}`,
  });
  return bucket;
}

/** Returns the reserved credit of a failed job. Idempotent. */
export async function refundCredit(jobId: string, note?: string, tx?: Tx) {
  const run = async (t: Tx) => {
    const consume = await t.creditLedger.findUnique({ where: { idempotencyKey: `consume:job:${jobId}` } });
    if (!consume) return null;
    await lockUser(t, consume.userId);
    const { row } = await insertLedgerOnce(t, {
      userId: consume.userId,
      type: "refund",
      amount: 1,
      bucket: consume.bucket,
      refId: jobId,
      idempotencyKey: `refund:job:${jobId}`,
      note,
    });
    return row;
  };
  return tx ? run(tx) : prisma.$transaction(run);
}

export async function grantSignupCredits(tx: Tx, userId: string, amount: number) {
  if (amount <= 0) return null;
  return (
    await insertLedgerOnce(tx, {
      userId,
      type: "free_signup",
      amount,
      bucket: "free",
      idempotencyKey: `signup:${userId}`,
    })
  ).row;
}

export async function grantPurchase(tx: Tx, userId: string, paymentId: string, credits: number) {
  await lockUser(tx, userId);
  return insertLedgerOnce(tx, {
    userId,
    type: "purchase",
    amount: credits,
    bucket: "paid",
    refId: paymentId,
    idempotencyKey: `purchase:payment:${paymentId}`,
  });
}

export async function reversePurchase(tx: Tx, userId: string, paymentId: string, credits: number) {
  await lockUser(tx, userId);
  return insertLedgerOnce(tx, {
    userId,
    type: "reversal",
    amount: -credits,
    bucket: "paid",
    refId: paymentId,
    idempotencyKey: `reversal:payment:${paymentId}`,
  });
}

export async function adminAdjust(tx: Tx, userId: string, amount: number, bucket: CreditBucket, actorId: string, note?: string) {
  await lockUser(tx, userId);
  return tx.creditLedger.create({
    data: {
      userId,
      type: "admin_adjust",
      amount,
      bucket,
      note,
      refId: actorId,
      idempotencyKey: `admin:${actorId}:${userId}:${Date.now()}:${Math.random().toString(36).slice(2)}`,
    },
  });
}
