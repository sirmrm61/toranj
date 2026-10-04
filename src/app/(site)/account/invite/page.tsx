import { ShareLink } from "@/components/account/share-link";
import { getAccountSummary } from "@/lib/account";
import { requirePageUser } from "@/lib/auth/page";
import { prisma } from "@/lib/db";
import { fa } from "@/lib/format";
import { formatFaDate } from "@/lib/jalali";
import { maskPhone } from "@/lib/phone";
import { getSettings } from "@/lib/settings";

const STATUS = {
  registered: "ثبت‌نام کرد — در انتظار اولین خرید",
  charged: "خرید کرد",
  rewarded: "هدیه دریافت شد",
  revoked: "لغو شد",
  rejected: "رد شد",
} as const;

export default async function InvitePage() {
  const user = await requirePageUser("/account/invite");
  const [s, settings, referrals] = await Promise.all([
    getAccountSummary(user),
    getSettings(),
    prisma.referral.findMany({ where: { inviterId: user.id }, include: { invitee: { select: { phone: true } } }, orderBy: { createdAt: "desc" } }),
  ]);
  const rewarded = referrals.filter((r) => r.status === "rewarded").length;
  return (
    <div className="space-y-6">
      <div className="card p-6 sm:p-8">
        <h1 className="section-title">دعوت از دوستان</h1>
        <p className="mt-3 leading-7 text-muted">
          لینک خود را برای دوستانتان بفرستید. وقتی دوستتان ثبت‌نام کند و اولین خریدش را انجام دهد، <strong className="text-gold-dark">{fa(settings.referralReward)} پرو آنلاین رایگان</strong> به حساب شما اضافه می‌شود.
        </p>
        <div className="mt-6">
          <ShareLink link={s.referralLink} code={s.referralCode} />
        </div>
        <p className="mt-6 text-xs text-muted">
          تاکنون {fa(rewarded)} از سقف {fa(settings.referralCap)} هدیه دعوت را دریافت کرده‌اید. پرو هدیه مانند پرو رایگان، پیش‌نمایش با واترمارک است.
        </p>
      </div>
      <div className="card p-6">
        <h2 className="mb-4 font-bold text-espresso">دعوت‌شده‌ها</h2>
        {referrals.length === 0 ? (
          <p className="text-sm text-muted">هنوز کسی با لینک شما ثبت‌نام نکرده است.</p>
        ) : (
          <ul className="divide-y divide-sand text-sm">
            {referrals.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span dir="ltr">{maskPhone(r.invitee.phone)}</span>
                <span className="text-xs text-muted">{formatFaDate(r.createdAt)}</span>
                <span className="badge">{STATUS[r.status]}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
