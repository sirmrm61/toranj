import type { Metadata } from "next";

export const metadata: Metadata = { title: "حریم خصوصی", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return (
    <article className="container-x max-w-3xl space-y-5 py-12 leading-8 text-ink/85">
      <h1 className="section-title">سیاست حریم خصوصی</h1>
      <p>ما فقط اطلاعاتی را جمع‌آوری می‌کنیم که برای ارائه خدمات لازم است: شماره موبایل برای ورود، اطلاعات فرم رزرو و عکس‌هایی که برای پرو آنلاین بارگذاری می‌کنید.</p>
      <h2 className="text-xl font-bold text-espresso">عکس‌های پرو آنلاین</h2>
      <ul className="list-disc space-y-2 pr-6">
        <li>عکس شما فقط برای خود شما قابل مشاهده است و در فضای ذخیره‌سازی خصوصی نگهداری می‌شود.</li>
        <li>اطلاعات متادیتا (مانند مکان عکس) هنگام بارگذاری حذف می‌شود.</li>
        <li>عکس اصلی حداکثر ۳۰ روز نگهداری و سپس به‌طور خودکار حذف می‌شود؛ هر زمان هم می‌توانید آن را از تاریخچه حذف کنید.</li>
        <li>عکس‌ها برای آموزش مدل‌های هوش مصنوعی یا تبلیغات استفاده نمی‌شوند.</li>
        <li>پردازش تصویر توسط سرویس هوش مصنوعی Google Gemini انجام می‌شود و تنها برای تولید نتیجه پرو ارسال می‌شود.</li>
      </ul>
      <h2 className="text-xl font-bold text-espresso">پرداخت</h2>
      <p>پرداخت‌ها از طریق درگاه بانکی معتبر انجام می‌شود و اطلاعات کارت شما هرگز در سرورهای ما ذخیره نمی‌شود.</p>
    </article>
  );
}
