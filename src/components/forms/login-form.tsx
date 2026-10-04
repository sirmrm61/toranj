"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { fa } from "@/lib/format";

function safeNext(next?: string) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";
}

export function LoginForm({ next, hasReferral }: { next?: string; hasReferral?: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState(0);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  async function requestCode(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const r = await api<{ ttl: number; devCode?: string }>("/api/auth/otp/request", { method: "POST", json: { phone } });
      setStep("code");
      setLeft(r.ttl);
      setDevCode(r.devCode ?? null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api("/api/auth/otp/verify", { method: "POST", json: { phone, code } });
      router.replace(safeNext(next));
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="card w-full max-w-md p-8">
      <h1 className="text-2xl font-bold text-espresso">ورود / ثبت‌نام</h1>
      <p className="mt-2 text-sm text-muted">
        با شماره موبایل وارد شوید؛ کاربران جدید <strong className="text-gold-dark">۳ پرو آنلاین رایگان</strong> هدیه می‌گیرند.
      </p>
      {hasReferral && <p className="mt-3 rounded-xl bg-gold/10 p-3 text-sm text-gold-dark">با لینک دعوت دوستتان وارد شده‌اید.</p>}

      {step === "phone" ? (
        <form onSubmit={requestCode} className="mt-6 space-y-4">
          <label className="block">
            <span className="label">شماره موبایل</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              dir="ltr"
              autoComplete="tel"
              placeholder="09xxxxxxxxx"
              className="input text-left text-lg tracking-wider"
              required
              autoFocus
            />
          </label>
          {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
          <button className="btn-primary w-full py-3.5" disabled={busy}>
            {busy ? "در حال ارسال…" : "دریافت کد تأیید"}
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="mt-6 space-y-4">
          <p className="text-sm text-muted">
            کد ۶ رقمی به <span dir="ltr" className="font-semibold text-espresso">{phone}</span> ارسال شد.{" "}
            <button type="button" onClick={() => setStep("phone")} className="text-gold-dark underline">
              تغییر شماره
            </button>
          </p>
          {devCode && (
            <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
              حالت توسعه (پیامک آزمایشی): کد <strong dir="ltr">{devCode}</strong>
            </p>
          )}
          <label className="block">
            <span className="label">کد تأیید</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              dir="ltr"
              maxLength={8}
              className="input text-center text-2xl tracking-[0.5em]"
              required
              autoFocus
            />
          </label>
          {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
          <button className="btn-primary w-full py-3.5" disabled={busy}>
            {busy ? "در حال بررسی…" : "ورود"}
          </button>
          <button type="button" className="w-full text-sm text-muted disabled:opacity-50" disabled={left > 0 || busy} onClick={() => requestCode()}>
            {left > 0 ? `ارسال دوباره تا ${fa(left)} ثانیه دیگر` : "ارسال دوباره کد"}
          </button>
        </form>
      )}
    </div>
  );
}
