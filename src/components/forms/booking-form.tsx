"use client";

import Link from "next/link";
import { useState } from "react";
import { site } from "@/content/site";
import { api } from "@/lib/client";
import { whatsappLink } from "@/lib/format";
import { JalaliDateInput } from "./jalali-date-input";

const TIMES = ["صبح (۱۱ تا ۱۴)", "بعدازظهر (۱۴ تا ۱۷)", "عصر (۱۷ تا ۲۰)"];

export function BookingForm({ gowns, defaultGown }: { gowns: { slug: string; name: string }[]; defaultGown?: string }) {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const body = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    for (const k of Object.keys(body)) if (body[k] === "" && k !== "website") delete body[k];
    setState("sending");
    try {
      await api("/api/bookings", { method: "POST", json: body });
      setState("done");
    } catch (err) {
      setError((err as Error).message);
      setState("idle");
    }
  }

  if (state === "done")
    return (
      <div className="card p-8 text-center" role="status">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-gold/15 text-2xl text-gold-dark">✓</div>
        <h2 className="text-xl font-bold text-espresso">درخواست شما ثبت شد</h2>
        <p className="mt-3 text-sm leading-7 text-muted">همکاران ما برای هماهنگی نهایی زمان پرو با شما تماس می‌گیرند. پیامک تأیید هم برایتان ارسال شد.</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/gowns" className="btn-outline">دیدن مدل‌های دیگر</Link>
          <Link href="/tryon" className="btn-gold">امتحان پرو آنلاین</Link>
        </div>
      </div>
    );

  return (
    <form onSubmit={onSubmit} className="card space-y-5 p-6 sm:p-8" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="label">نام و نام خانوادگی *</span>
          <input name="name" required minLength={2} maxLength={60} className="input" autoComplete="name" />
        </label>
        <label className="block">
          <span className="label">شماره موبایل *</span>
          <input name="phone" required inputMode="tel" dir="ltr" placeholder="09xxxxxxxxx" className="input text-left" autoComplete="tel" />
        </label>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <JalaliDateInput name="eventDate" label="تاریخ مراسم" />
        <JalaliDateInput name="preferredDate" label="تاریخ دلخواه برای پرو" yearsAhead={1} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="label">ساعت دلخواه</span>
          <select name="preferredTime" className="input" defaultValue="">
            <option value="">فرقی نمی‌کند</option>
            {TIMES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">مدل موردنظر (اختیاری)</span>
          <select name="gownSlug" className="input" defaultValue={defaultGown ?? ""}>
            <option value="">هنوز انتخاب نکرده‌ام</option>
            {gowns.map((g) => (
              <option key={g.slug} value={g.slug}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block">
        <span className="label">توضیحات (اختیاری)</span>
        <textarea name="note" maxLength={500} rows={3} className="input" placeholder="مثلاً سایز، بودجه یا سبک موردعلاقه" />
      </label>
      {/* honeypot */}
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      <button className="btn-primary w-full py-4 text-base" disabled={state === "sending"}>
        {state === "sending" ? "در حال ثبت…" : "ثبت درخواست پرو حضوری"}
      </button>
      <p className="text-center text-xs text-muted">
        ترجیح می‌دهید پیام بدهید؟{" "}
        <a className="text-gold-dark underline" href={whatsappLink(site.whatsapp, "سلام، می‌خواهم وقت پرو رزرو کنم.")} target="_blank" rel="noopener">
          رزرو از طریق واتس‌اپ
        </a>
      </p>
    </form>
  );
}
