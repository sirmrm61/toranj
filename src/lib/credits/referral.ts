import type { Payment } from "@/generated/prisma/client";
import type { Tx } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { insertLedgerOnce, lockUser } from "./ledger";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateReferralCode(length = 7): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export type SignupContext = { ip: string | null; deviceId: string | null };

/** Fraud rules for a new invitee (FR-22). Returns a reason when the referral must not be rewarded. */
export function referralFraudReason(
  inviter: { id: string; signupIp: string | null; deviceId: string | null },
  invitee: { id: string },
  ctx: SignupContext,
): string | null {
  if (inviter.id === invitee.id) return "self_invite";
  if (ctx.deviceId && inviter.deviceId && ctx.deviceId === inviter.deviceId) return "shared_device";
  if (ctx.ip && inviter.signupIp && ctx.ip === inviter.signupIp && ctx.ip !== "unknown") return "shared_ip";
  return null;
}

export async function attachReferral(tx: Tx, inviteeId: string, code: string, ctx: SignupContext) {
  const inviter = await tx.user.findUnique({ where: { referralCode: code.toUpperCase() } });
  if (!inviter) return null;
  const reason = referralFraudReason(inviter, { id: inviteeId }, ctx);
  if (reason === "self_invite") return null;
  await tx.user.update({ where: { id: inviteeId }, data: { referredById: inviter.id } });
  return tx.referral.create({
    data: {
      inviterId: inviter.id,
      inviteeId,
      status: reason ? "rejected" : "registered",
      flagReason: reason,
    },
  });
}

export type ReferralRewardResult = { inviterId: string; rewarded: boolean; reason?: string } | null;

/** Called inside the payment-confirmation transaction (FR-19). */
export async function onInviteePaymentConfirmed(tx: Tx, payment: Payment): Promise<ReferralRewardResult> {
  const referral = await tx.referral.findUnique({ where: { inviteeId: payment.userId } });
  if (!referral || referral.status !== "registered") return null;

  const settings = await getSettings();
  if (payment.amountIrr < settings.referralMinPaymentIrr) return null;

  await lockUser(tx, referral.inviterId);
  const rewardedCount = await tx.referral.count({ where: { inviterId: referral.inviterId, status: "rewarded" } });
  if (rewardedCount >= settings.referralCap) {
    await tx.referral.update({ where: { id: referral.id }, data: { status: "charged", flagReason: "cap_reached" } });
    return { inviterId: referral.inviterId, rewarded: false, reason: "cap_reached" };
  }

  const { row } = await insertLedgerOnce(tx, {
    userId: referral.inviterId,
    type: "referral_bonus",
    amount: settings.referralReward,
    bucket: "free",
    refId: referral.id,
    idempotencyKey: `referral:${referral.id}`,
  });
  await tx.referral.update({
    where: { id: referral.id },
    data: { status: "rewarded", rewardLedgerId: row.id, flagReason: `payment:${payment.id}` },
  });
  return { inviterId: referral.inviterId, rewarded: true };
}

/** Called when a payment is refunded/reversed (FR-21). Revokes the gift it activated. */
export async function onInviteePaymentReversed(tx: Tx, payment: Payment) {
  const referral = await tx.referral.findUnique({ where: { inviteeId: payment.userId } });
  if (!referral || referral.status !== "rewarded" || referral.flagReason !== `payment:${payment.id}`) return null;
  const reward = referral.rewardLedgerId
    ? await tx.creditLedger.findUnique({ where: { id: referral.rewardLedgerId } })
    : null;
  await lockUser(tx, referral.inviterId);
  if (reward) {
    await insertLedgerOnce(tx, {
      userId: referral.inviterId,
      type: "reversal",
      amount: -reward.amount,
      bucket: "free",
      refId: referral.id,
      idempotencyKey: `revoke:referral:${referral.id}`,
    });
  }
  return tx.referral.update({ where: { id: referral.id }, data: { status: "revoked" } });
}
