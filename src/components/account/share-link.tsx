"use client";

import { useState } from "react";

export function ShareLink({ link, code }: { link: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const text = `با این لینک در مزون ترنج ثبت‌نام کن و ۳ پرو آنلاین لباس عروس رایگان بگیر: ${link}`;
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input readOnly value={link} dir="ltr" className="input text-left" onFocus={(e) => e.target.select()} aria-label="لینک دعوت" />
        <button
          type="button"
          className="btn-primary shrink-0"
          onClick={async () => {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? "کپی شد" : "کپی لینک"}
        </button>
      </div>
      <p className="text-sm text-muted">
        کد دعوت شما: <strong className="tracking-widest text-espresso" dir="ltr">{code}</strong>
      </p>
      <div className="flex flex-wrap gap-2">
        <a className="btn-outline text-xs" target="_blank" rel="noopener" href={`https://wa.me/?text=${encodeURIComponent(text)}`}>ارسال در واتس‌اپ</a>
        <a className="btn-outline text-xs" target="_blank" rel="noopener" href={`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`}>ارسال در تلگرام</a>
        <button
          type="button"
          className="btn-outline text-xs"
          onClick={() => (navigator.share ? navigator.share({ title: "مزون ترنج", text, url: link }).catch(() => {}) : navigator.clipboard.writeText(text))}
        >
          اشتراک‌گذاری…
        </button>
      </div>
    </div>
  );
}
