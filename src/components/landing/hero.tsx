"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { site } from "@/content/site";
import { AUTOPLAY_MS, landing } from "./config";
import type { PointerState } from "./scene";

const HeroScene = dynamic(() => import("./scene"), { ssr: false });

type Mode = "pending" | "webgl" | "fallback";
const G = landing.gowns;

let detected: Mode | null = null;
function detectMode(): Mode {
  if (detected) return detected;
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const weak = (nav.hardwareConcurrency ?? 8) < 4 || (nav.deviceMemory ?? 8) < 3 || !!nav.connection?.saveData;
  let gl = false;
  try {
    const c = document.createElement("canvas");
    gl = !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    gl = false;
  }
  const forced = new URLSearchParams(window.location.search).get("hero");
  detected = forced === "webgl" && gl ? "webgl" : forced === "static" || reduced || weak || !gl ? "fallback" : "webgl";
  return detected;
}
const noopSubscribe = () => () => {};

export function Hero() {
  const mode = useSyncExternalStore(noopSubscribe, detectMode, () => "pending" as Mode);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const pointer = useRef<PointerState>({ x: 0, y: 0, px: 0, py: 0, active: false });
  const touchX = useRef<number | null>(null);

  const go = useCallback((d: number) => setIndex((i) => (i + d + G.length) % G.length), []);

  useEffect(() => {
    if (paused || hovered || !visible) return;
    const t = setTimeout(() => go(1), AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [index, paused, hovered, visible, go]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting && !document.hidden), { threshold: 0.05 });
    io.observe(el);
    const onVis = () => setVisible(!document.hidden && el.getBoundingClientRect().bottom > 0);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  useEffect(() => {
    if (mode !== "webgl") return;
    const el = rootRef.current!;
    const set = (cx: number, cy: number) => {
      const r = el.getBoundingClientRect();
      const p = pointer.current;
      p.x = ((cx - r.left) / r.width) * 2 - 1;
      p.y = -(((cy - r.top) / r.height) * 2 - 1);
      p.active = true;
    };
    const onMove = (e: PointerEvent) => set(e.clientX, e.clientY);
    const onLeave = () => (pointer.current.active = false);
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      const p = pointer.current;
      p.x = Math.max(-1, Math.min(1, e.gamma / 30));
      p.y = Math.max(-1, Math.min(1, (45 - e.beta) / 30));
      p.active = true;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    window.addEventListener("deviceorientation", onOrient);
    return () => {
      window.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("deviceorientation", onOrient);
    };
  }, [mode]);

  const askGyro = () => {
    const D = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
    D.requestPermission?.().catch(() => {});
  };

  const gown = G[index];

  return (
    <section
      ref={rootRef}
      className="relative h-[100svh] min-h-[560px] overflow-hidden bg-espresso text-white outline-none"
      aria-roledescription="carousel"
      aria-label="معرفی لباس‌های مزون ترنج"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(1);
        else if (e.key === "ArrowRight") go(-1);
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
        askGyro();
      }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      {/* Static poster: LCP image, no-JS view and the reduced-motion / weak-device fallback. */}
      <div className={`absolute inset-0 transition-opacity duration-700 ${mode === "webgl" && ready ? "opacity-0" : "opacity-100"}`}>
        {G.map((g, i) => (
          <Image
            key={g.key}
            src={g.poster}
            alt={i === index ? `عروس با لباس ${g.name} — تصویر تولیدشده با هوش مصنوعی` : ""}
            fill
            sizes="100vw"
            priority={i === 0}
            className={`object-cover transition-[opacity,transform] duration-1000 ${i === index ? "scale-100 opacity-100" : "scale-105 opacity-0"}`}
          />
        ))}
      </div>
      {mode === "webgl" && (
        <div className="absolute inset-0">
          <HeroScene index={index} pointer={pointer} running={visible} onReady={() => setReady(true)} />
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-black/55 via-black/10 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />

      <div className="container-x relative flex h-full flex-col justify-end pb-24 sm:justify-center sm:pb-0">
        <div className="max-w-lg sm:mr-0">
          <p className="eyebrow text-gold-light">مزون لباس عروس در {site.city}</p>
          <h1 className="mt-3 text-4xl font-black leading-tight sm:text-6xl">ترنج؛ لباسی که داستان شما را روایت می‌کند</h1>
          <p className="mt-4 text-base leading-8 text-white/80 sm:text-lg">
            لباس‌های دوخت ترنج را ببینید، به‌صورت آنلاین روی عکس خودتان امتحان کنید و برای پرو حضوری وقت بگیرید.
          </p>
          <div className="pointer-events-auto mt-8 flex flex-wrap gap-3">
            <Link href={`/booking?gown=${encodeURIComponent(gown.slug)}`} className="btn-gold px-7 py-4 text-base">رزرو وقت پرو حضوری</Link>
            <Link href={`/tryon?gown=${encodeURIComponent(gown.slug)}`} className="btn-ghost-light px-7 py-4 text-base">پرو آنلاین رایگان</Link>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-6 z-10">
        <div className="container-x flex items-end justify-between gap-4">
          <div aria-live="polite" className="min-w-0">
            <Link href={`/gowns/${encodeURIComponent(gown.slug)}`} className="group block">
              <p className="text-xs text-white/60">مدل {(index + 1).toLocaleString("fa-IR")} از {G.length.toLocaleString("fa-IR")}</p>
              <p className="text-lg font-bold group-hover:text-gold-light">«{gown.name}» <span className="text-sm font-normal text-white/70">— {gown.tagline}</span></p>
            </Link>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={() => go(-1)} className="grid h-10 w-10 place-items-center rounded-full border border-white/30 hover:bg-white/10" aria-label="لباس قبلی">›</button>
            <div className="hidden gap-1.5 sm:flex">
              {G.map((g, i) => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`نمایش لباس ${g.name}`}
                  aria-current={i === index}
                  className={`h-1.5 rounded-full transition-all ${i === index ? "w-8 bg-gold" : "w-3 bg-white/40 hover:bg-white/70"}`}
                />
              ))}
            </div>
            <button type="button" onClick={() => go(1)} className="grid h-10 w-10 place-items-center rounded-full border border-white/30 hover:bg-white/10" aria-label="لباس بعدی">‹</button>
            <button type="button" onClick={() => setPaused((p) => !p)} className="grid h-10 w-10 place-items-center rounded-full border border-white/30 text-xs hover:bg-white/10" aria-label={paused ? "پخش خودکار" : "توقف پخش خودکار"}>
              {paused ? "▶" : "❚❚"}
            </button>
          </div>
        </div>
        <p className="container-x mt-3 text-[10px] text-white/45">{site.aiDisclosure}</p>
      </div>
    </section>
  );
}
