import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";

/** Admin dashboard metrics (PRD §9: consumption report, conversion, AI cost). */
export async function dashboardReport(days = 30) {
  const since = new Date(Date.now() - days * 86400_000);
  const [users, newUsers, bookings, newBookings, tryonsByStatus, tryonsByBucket, paid, referralsByStatus, settings, reported] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: since } } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { createdAt: { gte: since } } }),
    prisma.tryonJob.groupBy({ by: ["status"], where: { createdAt: { gte: since } }, _count: true }),
    prisma.tryonJob.groupBy({ by: ["bucketUsed"], where: { createdAt: { gte: since }, status: "done" }, _count: true }),
    prisma.payment.aggregate({ where: { status: "PAID", verifiedAt: { gte: since } }, _sum: { amountIrr: true, credits: true }, _count: true }),
    prisma.referral.groupBy({ by: ["status"], _count: true }),
    getSettings(),
    prisma.tryonJob.count({ where: { reported: true } }),
  ]);
  const payingUsers = await prisma.payment.groupBy({ by: ["userId"], where: { status: "PAID" } });
  const tryonUsers = await prisma.tryonJob.groupBy({ by: ["userId"] });
  const status = Object.fromEntries(tryonsByStatus.map((r) => [r.status, r._count])) as Record<string, number>;
  const bucket = Object.fromEntries(tryonsByBucket.map((r) => [r.bucketUsed, r._count])) as Record<string, number>;
  const generated = (status.done ?? 0) + (status.failed ?? 0);
  return {
    days,
    users,
    newUsers,
    bookings,
    newBookings,
    tryons: { done: status.done ?? 0, failed: status.failed ?? 0, pending: (status.queued ?? 0) + (status.running ?? 0), free: bucket.free ?? 0, paid: bucket.paid ?? 0 },
    successRate: generated ? (status.done ?? 0) / generated : 1,
    revenueIrr: paid._sum.amountIrr ?? 0,
    paymentsCount: paid._count,
    creditsSold: paid._sum.credits ?? 0,
    conversion: tryonUsers.length ? payingUsers.length / tryonUsers.length : 0,
    estimatedCostIrr: (status.done ?? 0) * settings.costPerTryonIrr,
    referrals: Object.fromEntries(referralsByStatus.map((r) => [r.status, r._count])) as Record<string, number>,
    reported,
  };
}
