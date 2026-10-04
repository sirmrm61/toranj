import { cookies } from "next/headers";
import { z } from "zod";
import { DEVICE_COOKIE, REF_COOKIE } from "@/lib/auth/constants";
import { verifyOtp } from "@/lib/auth/otp";
import { createSession } from "@/lib/auth/session";
import { findOrCreateUser } from "@/lib/auth/users";
import { clientIp, handler, HttpError, json, parseJson } from "@/lib/http";
import { normalizeIranMobile, toLatinDigits } from "@/lib/phone";

const schema = z.object({
  phone: z.string().min(10).max(16),
  code: z.string().min(4).max(8),
  ref: z.string().max(12).optional(),
});

export const POST = handler(async (req: Request) => {
  const body = await parseJson(req, schema);
  const phone = normalizeIranMobile(body.phone);
  if (!phone) throw new HttpError(422, "شماره موبایل معتبر نیست.", "invalid_phone");
  await verifyOtp(phone, toLatinDigits(body.code).trim());

  const jar = await cookies();
  const user = await findOrCreateUser(phone, {
    ip: clientIp(req),
    deviceId: jar.get(DEVICE_COOKIE)?.value ?? null,
    referralCode: body.ref || jar.get(REF_COOKIE)?.value || null,
  });
  if (user.blocked) throw new HttpError(403, "حساب کاربری شما مسدود شده است.", "blocked");
  await createSession(user.id);
  jar.delete(REF_COOKIE);
  return json({ ok: true, user: { id: user.id, phone: user.phone, role: user.role } });
});
