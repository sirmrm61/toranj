import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { audit } from "@/lib/audit";
import { grantSignupCredits } from "@/lib/credits/ledger";
import { attachReferral, generateReferralCode, type SignupContext } from "@/lib/credits/referral";
import { getSettings } from "@/lib/settings";

/**
 * Decides whether a new account receives the free quota (FR-15):
 * one quota per phone (guaranteed by unique phone), one per device, and a per-IP daily cap.
 */
async function freeQuotaAbuseReason(ctx: SignupContext, perIpPerDay: number): Promise<string | null> {
  if (ctx.deviceId) {
    const sameDevice = await prisma.user.count({ where: { deviceId: ctx.deviceId } });
    if (sameDevice > 0) return "device_already_has_account";
  }
  if (ctx.ip && ctx.ip !== "unknown") {
    const sameIp = await prisma.user.count({
      where: { signupIp: ctx.ip, createdAt: { gt: new Date(Date.now() - 86400_000) } },
    });
    if (sameIp >= perIpPerDay) return "ip_daily_limit";
  }
  return null;
}

export async function findOrCreateUser(phone: string, ctx: SignupContext & { referralCode?: string | null }) {
  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    if (env.adminPhones.includes(phone) && existing.role !== "ADMIN") {
      return prisma.user.update({ where: { id: existing.id }, data: { role: "ADMIN" } });
    }
    return existing;
  }

  const settings = await getSettings();
  const abuse = await freeQuotaAbuseReason(ctx, settings.freeSignupsPerIpPerDay);

  return prisma.$transaction(async (tx) => {
    let referralCode = generateReferralCode();
    while (await tx.user.findUnique({ where: { referralCode } })) referralCode = generateReferralCode();

    const user = await tx.user.create({
      data: {
        phone,
        referralCode,
        signupIp: ctx.ip,
        deviceId: ctx.deviceId,
        role: env.adminPhones.includes(phone) ? "ADMIN" : "USER",
      },
    });
    if (abuse) {
      await audit("signup.free_quota_denied", user.id, { reason: abuse, ip: ctx.ip, deviceId: ctx.deviceId }, tx);
    } else {
      await grantSignupCredits(tx, user.id, settings.freeQuota);
    }
    if (ctx.referralCode) await attachReferral(tx, user.id, ctx.referralCode, ctx);
    return user;
  });
}
