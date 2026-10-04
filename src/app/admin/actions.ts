"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import sharp from "sharp";
import { z } from "zod";
import type { BookingStatus, GownMode, GownStatus, GownStyle, GownType } from "@/generated/prisma/enums";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/session";
import { adminAdjust, refundCredit } from "@/lib/credits/ledger";
import { prisma } from "@/lib/db";
import { gownMediaUrl } from "@/lib/gown-images";
import { refundPayment } from "@/lib/payments";
import { updateSettings, type AppSettings } from "@/lib/settings";
import { storage } from "@/lib/storage";

const str = (fd: FormData, k: string) => {
  const v = fd.get(k);
  return typeof v === "string" ? v.trim() : "";
};

/* ---------- Gowns ---------- */

const gownSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[\p{L}\p{N}-]+$/u, "نامک فقط شامل حروف، عدد و خط تیره باشد"),
  name: z.string().min(1).max(80),
  tagline: z.string().max(160).optional(),
  description: z.string().min(1).max(4000),
  fabric: z.string().max(160).optional(),
  type: z.enum(["BRIDAL", "ENGAGEMENT", "EVENING", "BRIDESMAID"]),
  style: z.enum(["PUFFY", "MERMAID", "SIMPLE", "A_LINE"]),
  neckline: z.string().max(60).optional(),
  sleeve: z.string().max(60).optional(),
  color: z.string().min(1).max(40),
  mode: z.enum(["SALE", "RENT", "BOTH"]),
  status: z.enum(["AVAILABLE", "SOLD", "RENTED", "HIDDEN"]),
  priceRange: z.string().max(80).optional(),
  featured: z.boolean(),
  sortOrder: z.number().int(),
});

async function uploadGownImages(files: File[], slugKey: string) {
  const urls: string[] = [];
  for (const f of files) {
    if (!f.size) continue;
    if (f.size > 10 * 1024 * 1024) throw new Error("حجم هر عکس حداکثر ۱۰ مگابایت");
    const webp = await sharp(Buffer.from(await f.arrayBuffer()))
      .rotate()
      .resize({ width: 1400, height: 2100, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    const key = `gowns/${slugKey}-${crypto.randomUUID().slice(0, 8)}.webp`;
    await storage.put(key, webp, "image/webp");
    urls.push(gownMediaUrl(key));
  }
  return urls;
}

export async function saveGown(fd: FormData) {
  const admin = await requireAdmin();
  const id = str(fd, "id") || null;
  const data = gownSchema.parse({
    slug: str(fd, "slug"),
    name: str(fd, "name"),
    tagline: str(fd, "tagline") || undefined,
    description: str(fd, "description"),
    fabric: str(fd, "fabric") || undefined,
    type: str(fd, "type") as GownType,
    style: str(fd, "style") as GownStyle,
    neckline: str(fd, "neckline") || undefined,
    sleeve: str(fd, "sleeve") || undefined,
    color: str(fd, "color"),
    mode: str(fd, "mode") as GownMode,
    status: str(fd, "status") as GownStatus,
    priceRange: str(fd, "priceRange") || undefined,
    featured: fd.get("featured") === "on",
    sortOrder: Number(str(fd, "sortOrder") || 0),
  });

  const existing = id ? await prisma.gown.findUnique({ where: { id } }) : null;
  const remove = new Set(fd.getAll("removeImage").map(String));
  const kept = (existing?.images ?? []).filter((i) => !remove.has(i));
  const files = fd.getAll("images").filter((f): f is File => f instanceof File);
  const uploaded = await uploadGownImages(files, crypto.randomUUID().slice(0, 8));
  const images = [...kept, ...uploaded];
  const refChoice = str(fd, "tryonRef");
  const tryonRefs = images.includes(refChoice) ? [refChoice] : images.slice(0, 1);

  for (const img of remove) {
    if (img.startsWith("/api/media/gowns/")) await storage.delete(`gowns/${img.slice("/api/media/gowns/".length)}`).catch(() => {});
  }

  const gown = id
    ? await prisma.gown.update({ where: { id }, data: { ...data, images, tryonRefs } })
    : await prisma.gown.create({ data: { ...data, images, tryonRefs } });
  await audit(id ? "gown.updated" : "gown.created", admin.id, { gownId: gown.id });
  revalidatePath("/gowns");
  revalidatePath("/admin/gowns");
  redirect(`/admin/gowns/${gown.id}?saved=1`);
}

export async function deleteGown(fd: FormData) {
  const admin = await requireAdmin();
  const id = str(fd, "id");
  const used = await prisma.tryonJob.count({ where: { gownId: id } });
  if (used > 0) {
    // keep history intact: hide instead of hard delete
    await prisma.gown.update({ where: { id }, data: { status: "HIDDEN" } });
  } else {
    await prisma.booking.updateMany({ where: { gownId: id }, data: { gownId: null } });
    await prisma.gown.delete({ where: { id } });
  }
  await audit("gown.deleted", admin.id, { gownId: id, hidden: used > 0 });
  revalidatePath("/gowns");
  redirect("/admin/gowns");
}

/* ---------- Bookings ---------- */

export async function setBookingStatus(fd: FormData) {
  const admin = await requireAdmin();
  const status = z.enum(["NEW", "CONFIRMED", "DONE", "CANCELLED"]).parse(str(fd, "status")) as BookingStatus;
  await prisma.booking.update({ where: { id: str(fd, "id") }, data: { status } });
  await audit("booking.status", admin.id, { id: str(fd, "id"), status });
  revalidatePath("/admin/bookings");
}

/* ---------- Users ---------- */

export async function toggleBlock(fd: FormData) {
  const admin = await requireAdmin();
  const id = str(fd, "id");
  if (id === admin.id) throw new Error("نمی‌توانید حساب خودتان را مسدود کنید.");
  const u = await prisma.user.findUniqueOrThrow({ where: { id } });
  await prisma.$transaction([
    prisma.user.update({ where: { id }, data: { blocked: !u.blocked } }),
    ...(u.blocked ? [] : [prisma.session.deleteMany({ where: { userId: id } })]),
  ]);
  await audit(u.blocked ? "user.unblocked" : "user.blocked", admin.id, { userId: id });
  revalidatePath("/admin/users");
}

export async function adjustCredits(fd: FormData) {
  const admin = await requireAdmin();
  const userId = str(fd, "id");
  const amount = z.number().int().min(-100).max(100).refine((n) => n !== 0).parse(Number(str(fd, "amount")));
  const bucket = z.enum(["free", "paid"]).parse(str(fd, "bucket"));
  const note = str(fd, "note").slice(0, 200) || undefined;
  await prisma.$transaction((tx) => adminAdjust(tx, userId, amount, bucket, admin.id, note));
  await audit("credits.adjusted", admin.id, { userId, amount, bucket, note: note ?? null });
  revalidatePath("/admin/users");
}

/* ---------- Payments & packages ---------- */

export async function refundPaymentAction(fd: FormData) {
  const admin = await requireAdmin();
  await refundPayment(str(fd, "id"), admin.id);
  revalidatePath("/admin/payments");
}

export async function savePackage(fd: FormData) {
  const admin = await requireAdmin();
  const data = z
    .object({ title: z.string().min(1).max(60), credits: z.number().int().min(1).max(1000), priceIrr: z.number().int().min(10000), sortOrder: z.number().int() })
    .parse({
      title: str(fd, "title"),
      credits: Number(str(fd, "credits")),
      priceIrr: Number(str(fd, "priceToman")) * 10,
      sortOrder: Number(str(fd, "sortOrder") || 0),
    });
  const id = str(fd, "id");
  const active = fd.get("active") === "on";
  if (id) await prisma.creditPackage.update({ where: { id }, data: { ...data, active } });
  else await prisma.creditPackage.create({ data: { ...data, active: true } });
  await audit("package.saved", admin.id, { id: id || null, ...data });
  revalidatePath("/admin/payments");
}

/* ---------- Referrals ---------- */

export async function approveReferral(fd: FormData) {
  const admin = await requireAdmin();
  const id = str(fd, "id");
  await prisma.referral.update({ where: { id, status: "rejected" }, data: { status: "registered", flagReason: "approved_by_admin" } });
  await audit("referral.approved", admin.id, { id });
  revalidatePath("/admin/referrals");
}

export async function revokeReferral(fd: FormData) {
  const admin = await requireAdmin();
  const id = str(fd, "id");
  await prisma.$transaction(async (tx) => {
    const r = await tx.referral.findUniqueOrThrow({ where: { id } });
    if (r.status === "rewarded" && r.rewardLedgerId) {
      const reward = await tx.creditLedger.findUnique({ where: { id: r.rewardLedgerId } });
      if (reward) {
        await tx.creditLedger.upsert({
          where: { idempotencyKey: `revoke:referral:${r.id}` },
          create: { userId: r.inviterId, type: "reversal", amount: -reward.amount, bucket: "free", refId: r.id, idempotencyKey: `revoke:referral:${r.id}` },
          update: {},
        });
      }
    }
    await tx.referral.update({ where: { id }, data: { status: "revoked" } });
  });
  await audit("referral.revoked", admin.id, { id });
  revalidatePath("/admin/referrals");
}

/* ---------- Try-ons ---------- */

export async function refundTryon(fd: FormData) {
  const admin = await requireAdmin();
  const id = str(fd, "id");
  await refundCredit(id, "برگشت اعتبار توسط مدیر پس از بررسی گزارش");
  await prisma.tryonJob.update({ where: { id }, data: { reported: false } });
  await audit("tryon.refunded", admin.id, { jobId: id });
  revalidatePath("/admin/tryons");
}

export async function dismissReport(fd: FormData) {
  await requireAdmin();
  await prisma.tryonJob.update({ where: { id: str(fd, "id") }, data: { reported: false } });
  revalidatePath("/admin/tryons");
}

/* ---------- Settings ---------- */

export async function saveSettings(fd: FormData) {
  const admin = await requireAdmin();
  const n = (k: string) => z.number().int().min(0).max(1_000_000_000).parse(Number(str(fd, k)));
  const patch: Partial<AppSettings> = {
    freeQuota: n("freeQuota"),
    referralReward: n("referralReward"),
    referralCap: n("referralCap"),
    referralMinPaymentIrr: n("referralMinPaymentToman") * 10,
    freeSignupsPerIpPerDay: n("freeSignupsPerIpPerDay"),
    costPerTryonIrr: n("costPerTryonToman") * 10,
    tryonPrompt: z.string().min(20).max(3000).parse(str(fd, "tryonPrompt")),
  };
  await updateSettings(patch);
  await audit("settings.updated", admin.id, patch as never);
  revalidatePath("/admin/settings");
  redirect("/admin/settings?saved=1");
}
