"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { site } from "@/content/site";
import { api } from "@/lib/client";
import { fa } from "@/lib/format";
import { TryonResult, type TryonView } from "./tryon-result";

type GownOpt = { id: string; slug: string; name: string; image: string | null };
type Balances = { free: number; paid: number; total: number };

const MAX = 8 * 1024 * 1024;

export function TryonStudio({ gowns, initialGownId, balances }: { gowns: GownOpt[]; initialGownId?: string; balances: Balances }) {
  const router = useRouter();
  const [gownId, setGownId] = useState(initialGownId ?? gowns[0]?.id);
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ msg: string; code?: number } | null>(null);
  const [job, setJob] = useState<TryonView | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const noCredit = balances.total <= 0;
  const nextBucket = balances.free > 0 ? "free" : "paid";

  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  useEffect(() => {
    if (!job || job.status === "done" || job.status === "failed") return;
    const t = setTimeout(async () => {
      try {
        const j = await api<TryonView>(`/api/tryon/${job.id}`);
        setJob(j);
        if (j.status === "done" || j.status === "failed") router.refresh();
      } catch {
        /* keep polling */
      }
    }, 2000);
    return () => clearTimeout(t);
  }, [job, router]);

  function pick(f: File | undefined) {
    setError(null);
    if (!f) return;
    if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(f.type) && !/\.(jpe?g|png|webp|heic|heif)$/i.test(f.name)) {
      setError({ msg: "فقط عکس با فرمت JPG، PNG، WebP یا HEIC قابل قبول است." });
      return;
    }
    if (f.size > MAX) {
      setError({ msg: "حجم عکس باید کمتر از ۸ مگابایت باشد." });
      return;
    }
    setFile(f);
  }

  async function submit() {
    if (!file || !gownId) return;
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.set("gownId", gownId);
    fd.set("photo", file);
    fd.set("consent", String(consent));
    try {
      const r = await api<{ jobId: string; status: TryonView["status"]; bucket: TryonView["bucket"] }>("/api/tryon", { method: "POST", body: fd });
      const g = gowns.find((x) => x.id === gownId);
      setJob({
        id: r.jobId,
        status: r.status,
        bucket: r.bucket,
        gown: g && { name: g.name, slug: g.slug },
        error: null,
        reported: false,
        previewUrl: null,
        fullUrl: null,
        downloadUrl: null,
        canDownload: false,
      });
      router.refresh();
    } catch (e) {
      const err = e as Error & { status?: number };
      setError({ msg: err.message, code: err.status });
    } finally {
      setBusy(false);
    }
  }

  const selected = gowns.find((g) => g.id === gownId);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="section-title">پرو آنلاین</h1>
        <p className="mt-2 text-sm text-muted">
          اعتبار باقی‌مانده: <strong className="text-espresso">{fa(balances.total)}</strong> ({fa(balances.free)} رایگان، {fa(balances.paid)} خریداری‌شده)
        </p>
      </header>

      {noCredit && !job && (
        <div className="card border-gold/40 bg-gold/5 p-6">
          <h2 className="font-bold text-espresso">پروهای رایگان شما تمام شد</h2>
          <p className="mt-2 text-sm text-muted">برای ادامه، یکی از بسته‌های اعتبار را بخرید یا با دعوت از دوستان ۳ پرو رایگان دیگر بگیرید.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/account/wallet" className="btn-gold">خرید اعتبار</Link>
            <Link href="/account/invite" className="btn-outline">دعوت از دوستان</Link>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="mb-3 font-semibold text-espresso">۱. انتخاب لباس</h2>
            <div className="grid max-h-80 grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4">
              {gowns.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGownId(g.id)}
                  aria-pressed={g.id === gownId}
                  className={`overflow-hidden rounded-xl text-xs ring-2 transition ${g.id === gownId ? "ring-gold" : "ring-sand hover:ring-gold/50"}`}
                >
                  <div className="relative aspect-[2/3] bg-cream">{g.image && <Image src={g.image} alt="" fill sizes="120px" className="object-cover" />}</div>
                  <span className="block truncate px-1 py-1.5">{g.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="mb-3 font-semibold text-espresso">۲. عکس تمام‌قد شما</h2>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                pick(e.dataTransfer.files[0]);
              }}
              className="relative grid aspect-[3/4] max-h-96 w-full place-items-center overflow-hidden rounded-xl border-2 border-dashed border-sand bg-cream/50 text-sm text-muted hover:border-gold"
            >
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element -- local object URL
                <img src={preview} alt="عکس انتخاب‌شده" className="h-full w-full object-contain" />
              ) : (
                <span>برای انتخاب یا گرفتن عکس کلیک کنید (یا عکس را اینجا رها کنید)</span>
              )}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              capture="environment"
              className="hidden"
              onChange={(e) => pick(e.target.files?.[0])}
            />
            <ul className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted">
              <li>✓ تمام‌قد و رو به دوربین</li>
              <li>✓ نور کافی و یکنواخت</li>
              <li>✓ فقط یک نفر در عکس</li>
              <li>✓ لباس ساده و پس‌زمینه خلوت</li>
            </ul>
          </div>

          <label className="flex items-start gap-3 text-sm leading-6">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 accent-[#b08d57]" />
            <span>
              تأیید می‌کنم عکس متعلق به خودم است و با <Link href="/privacy" className="text-gold-dark underline">شرایط نگهداری و پردازش عکس</Link> (حذف خودکار پس از ۳۰ روز) موافقم.
            </span>
          </label>

          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-800" role="alert">
              {error.msg}
              {error.code === 402 && (
                <div className="mt-2 flex gap-3">
                  <Link href="/account/wallet" className="underline">خرید اعتبار</Link>
                  <Link href="/account/invite" className="underline">دعوت از دوستان</Link>
                </div>
              )}
            </div>
          )}

          <button className="btn-gold w-full py-4 text-base" disabled={!file || !gownId || !consent || busy || noCredit} onClick={submit}>
            {busy ? "در حال ارسال…" : `پرو «${selected?.name ?? ""}» (${nextBucket === "free" ? "پرو رایگان" : "۱ اعتبار"})`}
          </button>
          <p className="text-xs text-muted">{site.tryonDisclaimer}</p>
        </div>

        <div>
          <div className="card sticky top-20 p-5">
            <h2 className="mb-3 font-semibold text-espresso">نتیجه</h2>
            {job ? (
              <TryonResult key={job.id + job.status} job={job} onDeleted={() => setJob(null)} />
            ) : selected?.image ? (
              <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-cream opacity-80">
                <Image src={selected.image} alt={selected.name} fill sizes="50vw" className="object-cover" />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
