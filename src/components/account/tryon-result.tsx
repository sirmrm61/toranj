"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/client";

export type TryonView = {
  id: string;
  status: "queued" | "running" | "done" | "failed";
  bucket: "free" | "paid";
  gown?: { name: string; slug: string };
  error: string | null;
  reported: boolean;
  previewUrl: string | null;
  fullUrl: string | null;
  downloadUrl: string | null;
  canDownload: boolean;
};

export function TryonResult({ job, onDeleted }: { job: TryonView; onDeleted?: () => void }) {
  const [reported, setReported] = useState(job.reported);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const src = job.fullUrl ?? job.previewUrl;

  if (job.status === "failed") {
    return (
      <div className="rounded-2xl bg-red-50 p-5 text-sm leading-7 text-red-800" role="alert">
        {job.error ?? "تولید تصویر ناموفق بود؛ اعتبار شما برگشت داده شد."}
        <div className="mt-3 flex gap-3">
          <Link href={`/booking${job.gown ? `?gown=${encodeURIComponent(job.gown.slug)}` : ""}`} className="text-red-900 underline">
            رزرو پرو حضوری
          </Link>
        </div>
      </div>
    );
  }
  if (job.status !== "done" || !src) {
    return (
      <div className="grid aspect-[2/3] place-items-center rounded-2xl bg-cream" role="status" aria-live="polite">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gold/30 border-t-gold" />
          <p className="mt-4 text-sm text-cocoa">{job.status === "queued" ? "در صف پردازش…" : "در حال ساخت تصویر شما با لباس…"}</p>
          <p className="mt-1 text-xs text-muted">معمولاً کمتر از یک دقیقه</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className="relative overflow-hidden rounded-2xl bg-cream select-none"
        onContextMenu={job.canDownload ? undefined : (e) => e.preventDefault()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- private, short-lived signed URL */}
        <img src={src} alt={`نتیجه پرو ${job.gown?.name ?? ""}`} className="w-full" draggable={job.canDownload} />
        {!job.canDownload && (
          <span className="absolute top-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white">پیش‌نمایش رایگان</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {job.canDownload && job.downloadUrl ? (
          <a href={job.downloadUrl} className="btn-gold">دانلود با کیفیت کامل</a>
        ) : (
          <Link href="/account/wallet" className="btn-outline text-xs">برای کیفیت کامل و دانلود، اعتبار بخرید</Link>
        )}
        {job.gown && (
          <Link href={`/booking?gown=${encodeURIComponent(job.gown.slug)}`} className="btn-primary">
            رزرو پرو حضوری این لباس
          </Link>
        )}
        <button
          type="button"
          className="btn-outline text-xs"
          disabled={reported || busy}
          onClick={async () => {
            setBusy(true);
            try {
              await api(`/api/tryon/${job.id}/report`, { method: "POST" });
              setReported(true);
              setMsg("گزارش شما ثبت شد؛ بررسی می‌کنیم.");
            } catch (e) {
              setMsg((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {reported ? "گزارش شد" : "گزارش نتیجه نامناسب"}
        </button>
        <button
          type="button"
          className="btn text-xs text-red-700 hover:bg-red-50"
          disabled={busy}
          onClick={async () => {
            if (!confirm("عکس شما و نتیجه این پرو برای همیشه حذف شود؟")) return;
            setBusy(true);
            try {
              await api(`/api/tryon/${job.id}`, { method: "DELETE" });
              onDeleted?.();
            } catch (e) {
              setMsg((e as Error).message);
              setBusy(false);
            }
          }}
        >
          حذف عکس و نتیجه
        </button>
      </div>
      {msg && <p className="text-xs text-muted">{msg}</p>}
    </div>
  );
}
