import type { Payment, User } from "@/generated/prisma/client";
import { audit } from "@/lib/audit";
import { grantPurchase, reversePurchase } from "@/lib/credits/ledger";
import { onInviteePaymentConfirmed, onInviteePaymentReversed } from "@/lib/credits/referral";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { HttpError } from "@/lib/http";
import { notify } from "@/lib/sms";
import { toPersianDigits } from "@/lib/phone";
import type { PaymentGateway } from "./gateway";
import { MockGateway } from "./mock";
import { ZarinpalGateway } from "./zarinpal";

export function gateway(name = env.payment.provider): PaymentGateway {
  return name === "zarinpal" ? new ZarinpalGateway() : new MockGateway();
}

export async function startPayment(user: User, packageId: string) {
  const pkg = await prisma.creditPackage.findUnique({ where: { id: packageId } });
  if (!pkg || !pkg.active) throw new HttpError(404, "بسته موردنظر پیدا نشد.");

  const gw = gateway();
  const payment = await prisma.payment.create({
    data: { userId: user.id, packageId: pkg.id, credits: pkg.credits, amountIrr: pkg.priceIrr, gateway: gw.name },
  });
  try {
    const r = await gw.request({
      amountIrr: pkg.priceIrr,
      callbackUrl: `${env.appUrl}/api/payments/callback`,
      description: `خرید ${pkg.title} (${pkg.credits} پرو آنلاین) - مزون ترنج`,
      mobile: user.phone,
      orderId: payment.id,
    });
    await prisma.payment.update({ where: { id: payment.id }, data: { authority: r.authority } });
    await audit("payment.started", user.id, { paymentId: payment.id, amount: pkg.priceIrr });
    return { paymentId: payment.id, redirectUrl: r.redirectUrl };
  } catch (e) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    console.error("[payment] request failed", e);
    throw new HttpError(502, "اتصال به درگاه پرداخت ناموفق بود؛ لطفاً دوباره تلاش کنید.");
  }
}

/**
 * Handles the gateway callback. Verification happens server-side only and is idempotent:
 * the unique authority + unique ledger key make double crediting impossible.
 */
export async function confirmPayment(authority: string, gatewayStatus: string | null) {
  const payment = await prisma.payment.findUnique({ where: { authority } });
  if (!payment) return { ok: false as const, reason: "not_found" };
  if (payment.status === "PAID") return { ok: true as const, payment };
  if (payment.status !== "PENDING") return { ok: false as const, reason: "closed", payment };

  if (gatewayStatus !== "OK") {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    return { ok: false as const, reason: "cancelled", payment };
  }

  const v = await gateway(payment.gateway as never).verify({ authority, amountIrr: payment.amountIrr });
  if (!v.ok) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    await audit("payment.verify_failed", payment.userId, { paymentId: payment.id, message: v.message ?? null });
    return { ok: false as const, reason: "verify_failed", payment };
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.payment.updateMany({
      where: { id: payment.id, status: "PENDING" },
      data: { status: "PAID", refNumber: v.refNumber, verifiedAt: new Date() },
    });
    if (updated.count === 0) return { referral: null };
    const paid = await tx.payment.findUniqueOrThrow({ where: { id: payment.id } });
    await grantPurchase(tx, paid.userId, paid.id, paid.credits);
    const referral = await onInviteePaymentConfirmed(tx, paid);
    return { referral };
  });

  await audit("payment.paid", payment.userId, { paymentId: payment.id, ref: v.refNumber ?? null });
  if (result.referral?.rewarded) {
    const inviter = await prisma.user.findUnique({ where: { id: result.referral.inviterId } });
    if (inviter) notify(inviter.phone, "مزون ترنج: دوست شما حسابش را شارژ کرد و پرو آنلاین رایگان هدیه به حساب شما اضافه شد.");
  }
  const fresh = await prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
  return { ok: true as const, payment: fresh };
}

/** Admin: mark a paid payment as refunded/chargebacked — reverses credits and the referral gift (FR-21). */
export async function refundPayment(paymentId: string, actorId: string) {
  return prisma.$transaction(async (tx) => {
    const p = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!p || p.status !== "PAID") throw new HttpError(422, "فقط پرداخت‌های موفق قابل بازگشت هستند.");
    await tx.payment.update({ where: { id: p.id }, data: { status: "REFUNDED" } });
    await reversePurchase(tx, p.userId, p.id, p.credits);
    await onInviteePaymentReversed(tx, p);
    await tx.auditLog.create({ data: { action: "payment.refunded", actor: actorId, meta: { paymentId } } });
    return p;
  });
}

export function formatIrr(amountIrr: number) {
  return `${toPersianDigits(Math.round(amountIrr / 10).toLocaleString("en-US")).replace(/,/g, "٬")} تومان`;
}

export type { Payment };
