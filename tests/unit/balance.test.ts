import { describe, expect, it } from "vitest";
import { pickBucket, sumBalances } from "@/lib/credits/balance";

describe("credit balances", () => {
  it("sums ledger rows per bucket", () => {
    const b = sumBalances([
      { bucket: "free", amount: 3 },
      { bucket: "free", amount: -1 },
      { bucket: "paid", amount: 5 },
      { bucket: "paid", amount: -2 },
    ]);
    expect(b).toEqual({ free: 2, paid: 3, total: 5 });
  });

  it("never reports negative totals", () => {
    expect(sumBalances([{ bucket: "paid", amount: -2 }]).total).toBe(0);
  });

  it("consumes free credits before paid ones", () => {
    expect(pickBucket({ free: 1, paid: 10, total: 11 })).toBe("free");
    expect(pickBucket({ free: 0, paid: 10, total: 10 })).toBe("paid");
    expect(pickBucket({ free: 0, paid: 0, total: 0 })).toBeNull();
  });
});
