import { saveSettings } from "@/app/admin/actions";
import { env } from "@/lib/env";
import { getSettings } from "@/lib/settings";

export default async function AdminSettings({ searchParams }: PageProps<"/admin/settings">) {
  const [s, { saved }] = await Promise.all([getSettings(), searchParams]);
  const num = (name: string, label: string, value: number, hint?: string) => (
    <label className="block">
      <span className="label">{label}</span>
      <input name={name} type="number" min={0} defaultValue={value} className="input" />
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-espresso">تنظیمات</h1>
      {saved && <p className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">تنظیمات ذخیره شد.</p>}
      <form action={saveSettings} className="card space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {num("freeQuota", "پرو رایگان کاربر جدید", s.freeQuota)}
          {num("referralReward", "هدیه هر دعوت موفق", s.referralReward)}
          {num("referralCap", "سقف هدیه دعوت برای هر کاربر", s.referralCap)}
          {num("referralMinPaymentToman", "حداقل مبلغ اولین خرید برای فعال‌شدن هدیه (تومان)", s.referralMinPaymentIrr / 10)}
          {num("freeSignupsPerIpPerDay", "حداکثر ثبت‌نام با اعتبار رایگان از یک IP در روز", s.freeSignupsPerIpPerDay)}
          {num("costPerTryonToman", "هزینه تخمینی هر پرو (تومان) برای گزارش", s.costPerTryonIrr / 10)}
        </div>
        <label className="block">
          <span className="label">پرامپت پرو آنلاین (مدل {env.ai.tryonModel})</span>
          <textarea name="tryonPrompt" rows={6} defaultValue={s.tryonPrompt} className="input leading-7" />
        </label>
        <p className="text-xs text-muted">
          سرویس‌ها: هوش مصنوعی <b>{env.ai.provider}</b> · پیامک <b>{env.sms.provider}</b> · پرداخت <b>{env.payment.provider}</b> (از طریق متغیرهای محیطی تنظیم می‌شوند)
        </p>
        <button className="btn-primary">ذخیره تنظیمات</button>
      </form>
    </div>
  );
}
