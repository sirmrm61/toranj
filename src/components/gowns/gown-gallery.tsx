"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

const LABELS = ["نمای جلو", "نمای پشت", "جزئیات"];

export function GownGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const next = useCallback((d: number) => setActive((a) => (a + d + images.length) % images.length), [images.length]);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(false);
      if (e.key === "ArrowLeft") next(1);
      if (e.key === "ArrowRight") next(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom, next]);

  if (images.length === 0) return <div className="aspect-[2/3] rounded-2xl bg-cream" />;
  return (
    <div>
      <button type="button" className="relative block aspect-[2/3] w-full cursor-zoom-in overflow-hidden rounded-2xl bg-cream" onClick={() => setZoom(true)} aria-label="بزرگنمایی تصویر">
        <Image src={images[active]} alt={`${alt} - ${LABELS[active] ?? ""}`} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
      </button>
      <div className="mt-3 grid grid-cols-4 gap-3">
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setActive(i)}
            className={`relative aspect-[2/3] overflow-hidden rounded-xl ring-2 transition ${i === active ? "ring-gold" : "ring-transparent opacity-70 hover:opacity-100"}`}
            aria-label={LABELS[i] ?? `تصویر ${i + 1}`}
          >
            <Image src={src} alt="" fill sizes="120px" className="object-cover" />
          </button>
        ))}
      </div>
      {zoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal onClick={() => setZoom(false)}>
          <div className="relative h-full w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <Image src={images[active]} alt={alt} fill sizes="100vw" className="object-contain" />
          </div>
          <button className="absolute top-4 left-4 text-3xl text-white" onClick={() => setZoom(false)} aria-label="بستن">×</button>
          {images.length > 1 && (
            <>
              <button className="absolute right-4 text-4xl text-white" onClick={(e) => (e.stopPropagation(), next(-1))} aria-label="قبلی">›</button>
              <button className="absolute left-4 text-4xl text-white" onClick={(e) => (e.stopPropagation(), next(1))} aria-label="بعدی">‹</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
