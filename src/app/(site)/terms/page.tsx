import type { Metadata } from "next";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "قوانین و شرایط", alternates: { canonical: "/terms" } };

export default function TermsPage() {
  return (
    <article className="container-x max-w-3xl space-y-5 py-12 leading-8 text-ink/85">
      <h1 className="section-title">قوانین و شرایط استفاده</h1>
      <h2 className="text-xl font-bold text-espresso">پرو آنلاین</h2>
      <ul className="list-disc space-y-2 pr-6">
        <li>هر کاربر پس از ثبت‌نام با شماره موبایل، ۳ پرو آنلاین رایگان دریافت می‌کند.</li>
        <li>نتایج پرو رایگان فقط به‌صورت پیش‌نمایش با واترمارک قابل مشاهده است و امکان دانلود یا اشتراک ندارد.</li>
        <li>نتایج پرو با اعتبار خریداری‌شده با کیفیت کامل و قابل دانلود است.</li>
        <li>در صورت خطا در تولید تصویر، اعتبار مصرف‌شده به‌طور خودکار برگشت داده می‌شود.</li>
        <li>فقط عکس خودتان را بارگذاری کنید؛ بارگذاری عکس دیگران بدون رضایت آن‌ها مجاز نیست.</li>
        <li>{site.tryonDisclaimer}</li>
      </ul>
      <h2 className="text-xl font-bold text-espresso">دعوت از دوستان</h2>
      <ul className="list-disc space-y-2 pr-6">
        <li>با هر دعوت موفق (ثبت‌نام و اولین خرید دوستتان) ۳ پرو رایگان هدیه می‌گیرید.</li>
        <li>پرو هدیه نیز مانند پرو رایگان شامل محدودیت واترمارک و عدم دانلود است.</li>
        <li>دعوت از خود، شماره‌های تکراری و حساب‌های جعلی پذیرفته نمی‌شود و در صورت بازگشت وجه، هدیه نیز لغو می‌شود.</li>
      </ul>
      <h2 className="text-xl font-bold text-espresso">خرید اعتبار</h2>
      <p>اعتبار خریداری‌شده منقضی نمی‌شود. درخواست بازگشت وجه برای اعتبارهای مصرف‌نشده از طریق تماس با پشتیبانی بررسی می‌شود.</p>
    </article>
  );
}
