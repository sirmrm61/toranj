import { z } from "zod";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { HttpError } from "@/lib/http";
import { formatFaDate, parseJalaliDate } from "@/lib/jalali";
import { normalizeIranMobile } from "@/lib/phone";
import { rateLimit } from "@/lib/rate-limit";
import { notify } from "@/lib/sms";

export const PREFERRED_TIMES = ["صبح (۱۱ تا ۱۴)", "بعدازظهر (۱۴ تا ۱۷)", "عصر (۱۷ تا ۲۰)"] as const;

const optionalJalali = z
  .string()
  .trim()
  .max(12)
  .optional()
  .transform((v, ctx) => {
    if (!v) return null;
    const d = parseJalaliDate(v);
    if (!d) {
      ctx.addIssue({ code: "custom", message: "تاریخ را به شکل ۱۴۰۵/۰۶/۲۰ وارد کنید." });
      return z.NEVER;
    }
    return d;
  });

export const bookingSchema = z.object({
  name: z.string().trim().min(2, "نام خود را وارد کنید.").max(60, "نام خیلی طولانی است."),
  phone: z
    .string()
    .transform((v, ctx) => {
      const p = normalizeIranMobile(v);
      if (!p) {
        ctx.addIssue({ code: "custom", message: "شماره موبایل معتبر نیست." });
        return z.NEVER;
      }
      return p;
    }),
  eventDate: optionalJalali,
  preferredDate: optionalJalali,
  preferredTime: z.enum(PREFERRED_TIMES).optional().or(z.literal("").transform(() => undefined)),
  gownSlug: z.string().max(80).optional(),
  note: z.string().trim().max(500, "توضیحات حداکثر ۵۰۰ کاراکتر است.").optional(),
  /** Honeypot: must stay empty (spam protection, PRD §8). */
  website: z.string().max(0).optional(),
});

export type BookingInput = z.input<typeof bookingSchema>;

export async function createBooking(input: z.output<typeof bookingSchema>, ip: string) {
  const [perIp, perPhone] = await Promise.all([rateLimit(`booking:ip:${ip}`, 5, 3600), rateLimit(`booking:phone:${input.phone}`, 3, 86400)]);
  if (!perIp.ok || !perPhone.ok) throw new HttpError(429, "درخواست‌های زیادی ثبت شده است؛ لطفاً بعداً تلاش کنید یا تماس بگیرید.");

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (input.preferredDate && input.preferredDate < today) throw new HttpError(422, "تاریخ پرو نمی‌تواند در گذشته باشد.");

  const gown = input.gownSlug ? await prisma.gown.findUnique({ where: { slug: input.gownSlug } }) : null;
  const booking = await prisma.booking.create({
    data: {
      name: input.name,
      phone: input.phone,
      eventDate: input.eventDate,
      preferredDate: input.preferredDate,
      preferredTime: input.preferredTime,
      gownId: gown?.id,
      note: input.note || null,
    },
  });
  await audit("booking.created", null, { bookingId: booking.id });

  notify(input.phone, `${input.name} عزیز، درخواست پرو شما در مزون ترنج ثبت شد. برای هماهنگی نهایی با شما تماس می‌گیریم.`);
  const shop = env.sms.shopPhones.length ? env.sms.shopPhones : env.adminPhones;
  if (shop.length) {
    notify(
      [...new Set(shop)],
      `رزرو جدید: ${input.name} ${input.phone}${input.preferredDate ? ` - ${formatFaDate(input.preferredDate)}` : ""}${gown ? ` - ${gown.name}` : ""}`,
    );
  }
  return booking;
}
