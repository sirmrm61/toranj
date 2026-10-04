import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { HttpError } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { sms } from "@/lib/sms";
import { hmac, randomDigits, safeEqual } from "./crypto";

export const OTP_TTL_SEC = 120;
export const OTP_MAX_ATTEMPTS = 5;
const OTP_LENGTH = 5;

const hashCode = (phone: string, code: string) => hmac(`otp:${phone}:${code}`);

export async function requestOtp(phone: string, ip: string) {
  const checks = await Promise.all([
    rateLimit(`otp:phone:min:${phone}`, 1, 60),
    rateLimit(`otp:phone:hour:${phone}`, 5, 3600),
    rateLimit(`otp:ip:hour:${ip}`, 20, 3600),
  ]);
  const blocked = checks.find((c) => !c.ok);
  if (blocked) {
    throw new HttpError(429, `تعداد درخواست‌ها زیاد است؛ ${blocked.retryAfter} ثانیه دیگر تلاش کنید.`, "rate_limited");
  }

  const code = randomDigits(OTP_LENGTH);
  await prisma.otpCode.create({
    data: { phone, codeHash: hashCode(phone, code), expiresAt: new Date(Date.now() + OTP_TTL_SEC * 1000), ip },
  });
  await sms().sendOtp(phone, code);

  const exposeCode = !env.isProd && env.sms.provider === "mock";
  return { ttl: OTP_TTL_SEC, devCode: exposeCode ? code : undefined };
}

export async function verifyOtp(phone: string, code: string) {
  const otp = await prisma.otpCode.findFirst({
    where: { phone, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) throw new HttpError(400, "کد منقضی شده است؛ دوباره درخواست کد بدهید.", "otp_expired");
  if (otp.attempts >= OTP_MAX_ATTEMPTS) throw new HttpError(429, "تعداد تلاش‌ها بیش از حد مجاز است.", "otp_locked");

  if (!safeEqual(otp.codeHash, hashCode(phone, code))) {
    await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    throw new HttpError(400, "کد واردشده صحیح نیست.", "otp_invalid");
  }
  const consumed = await prisma.otpCode.updateMany({
    where: { id: otp.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  if (consumed.count !== 1) throw new HttpError(400, "این کد قبلاً استفاده شده است.", "otp_used");
}
