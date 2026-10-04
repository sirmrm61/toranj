import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getBalances, refundCredit, reserveCredit, grantSignupCredits } from "@/lib/credits/ledger";
import { generateReferralCode } from "@/lib/credits/referral";
import { prisma } from "@/lib/db";
import { confirmPayment, refundPayment, startPayment } from "@/lib/payments";

const run = process.env.DATABASE_URL ? describe : describe.skip;
const tag = `t${Date.now().toString(36)}`;
const phone = (n: number) => `0990${String(Date.now()).slice(-6)}${n}`.slice(0, 11);

async function user(n: number) {
  return prisma.user.create({ data: { phone: phone(n), referralCode: generateReferralCode(9), signupIp: `10.0.0.${n}` } });
}

run("credit ledger, payments and referrals (database)", () => {
  let pkgId: string;
  const created: string[] = [];

  beforeAll(async () => {
    process.env.PAYMENT_PROVIDER = "mock";
    const pkg = await prisma.creditPackage.create({ data: { title: `test-${tag}`, credits: 5, priceIrr: 100_000, active: false } });
    pkgId = pkg.id;
  });

  afterAll(async () => {
    await prisma.referral.deleteMany({ where: { OR: [{ inviterId: { in: created } }, { inviteeId: { in: created } }] } });
    await prisma.creditLedger.deleteMany({ where: { userId: { in: created } } });
    await prisma.payment.deleteMany({ where: { userId: { in: created } } });
    await prisma.auditLog.deleteMany({ where: { actor: { in: created } } });
    await prisma.user.deleteMany({ where: { id: { in: created } } });
    await prisma.creditPackage.delete({ where: { id: pkgId } });
    await prisma.$disconnect();
  });

  it("grants 3 free credits once, consumes free first and blocks at zero", async () => {
    const u = await user(1);
    created.push(u.id);
    await prisma.$transaction((tx) => grantSignupCredits(tx, u.id, 3));
    await prisma.$transaction((tx) => grantSignupCredits(tx, u.id, 3));
    expect(await getBalances(u.id)).toMatchObject({ free: 3, paid: 0 });

    for (let i = 0; i < 3; i++) {
      expect(await prisma.$transaction((tx) => reserveCredit(tx, u.id, `${tag}-a${i}`))).toBe("free");
    }
    await expect(prisma.$transaction((tx) => reserveCredit(tx, u.id, `${tag}-a3`))).rejects.toMatchObject({ status: 402 });

    await refundCredit(`${tag}-a0`);
    await refundCredit(`${tag}-a0`);
    expect((await getBalances(u.id)).free).toBe(1);
  });

  it("does not double-spend under concurrency", async () => {
    const u = await user(2);
    created.push(u.id);
    await prisma.$transaction((tx) => grantSignupCredits(tx, u.id, 2));
    const results = await Promise.allSettled(
      Array.from({ length: 5 }, (_, i) => prisma.$transaction((tx) => reserveCredit(tx, u.id, `${tag}-c${i}`))),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(2);
    expect((await getBalances(u.id)).free).toBe(0);
  });

  it("verifies payments server-side, idempotently, and rewards the inviter once", async () => {
    const inviter = await user(3);
    const invitee = await user(4);
    created.push(inviter.id, invitee.id);
    await prisma.referral.create({ data: { inviterId: inviter.id, inviteeId: invitee.id, status: "registered" } });

    await prisma.creditPackage.update({ where: { id: pkgId }, data: { active: true } });
    const { paymentId } = await startPayment(invitee, pkgId);
    const { authority } = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
    await prisma.creditPackage.update({ where: { id: pkgId }, data: { active: false } });

    const [a, b] = await Promise.all([confirmPayment(authority!, "OK"), confirmPayment(authority!, "OK")]);
    expect(a.ok && b.ok).toBe(true);
    expect((await getBalances(invitee.id)).paid).toBe(5);
    expect((await getBalances(inviter.id)).free).toBe(3);
    expect((await prisma.referral.findUniqueOrThrow({ where: { inviteeId: invitee.id } })).status).toBe("rewarded");

    const payment = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
    await refundPayment(payment.id, inviter.id);
    expect((await getBalances(invitee.id)).paid).toBe(0);
    expect((await getBalances(inviter.id)).free).toBe(0);
    expect((await prisma.referral.findUniqueOrThrow({ where: { inviteeId: invitee.id } })).status).toBe("revoked");
  });

  it("marks cancelled gateway callbacks as failed without credits", async () => {
    const u = await user(5);
    created.push(u.id);
    await prisma.creditPackage.update({ where: { id: pkgId }, data: { active: true } });
    const { paymentId } = await startPayment(u, pkgId);
    const { authority } = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
    await prisma.creditPackage.update({ where: { id: pkgId }, data: { active: false } });
    const r = await confirmPayment(authority!, "NOK");
    expect(r.ok).toBe(false);
    expect((await getBalances(u.id)).paid).toBe(0);
  });
});
