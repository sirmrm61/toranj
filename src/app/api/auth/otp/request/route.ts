import { z } from "zod";
import { requestOtp } from "@/lib/auth/otp";
import { clientIp, handler, HttpError, json, parseJson } from "@/lib/http";
import { normalizeIranMobile } from "@/lib/phone";

const schema = z.object({ phone: z.string().min(10).max(16) });

export const POST = handler(async (req: Request) => {
  const { phone: raw } = await parseJson(req, schema);
  const phone = normalizeIranMobile(raw);
  if (!phone) throw new HttpError(422, "شماره موبایل معتبر نیست.", "invalid_phone");
  const r = await requestOtp(phone, clientIp(req));
  return json({ ok: true, phone, ttl: r.ttl, devCode: r.devCode });
});
