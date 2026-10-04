import type { CreditBucket } from "@/generated/prisma/enums";

export type Balances = { free: number; paid: number; total: number };

export function sumBalances(rows: { bucket: CreditBucket; amount: number }[]): Balances {
  let free = 0;
  let paid = 0;
  for (const r of rows) {
    if (r.bucket === "free") free += r.amount;
    else paid += r.amount;
  }
  return { free, paid, total: Math.max(0, free) + Math.max(0, paid) };
}

/** Free credits (signup quota + referral gifts) are always consumed before paid ones. */
export function pickBucket(b: Balances): CreditBucket | null {
  if (b.free > 0) return "free";
  if (b.paid > 0) return "paid";
  return null;
}
