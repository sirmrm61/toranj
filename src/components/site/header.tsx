"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AccountButton } from "./account-button";
import { Logo } from "./logo";

export const NAV = [
  { href: "/gowns", label: "گالری لباس‌ها" },
  { href: "/tryon", label: "پرو آنلاین" },
  { href: "/booking", label: "رزرو وقت پرو" },
  { href: "/about", label: "درباره ما" },
  { href: "/faq", label: "سوالات متداول" },
  { href: "/contact", label: "تماس" },
];

export function Header({ overlay = false }: { overlay?: boolean }) {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const light = overlay && !scrolled && !open;
  return (
    <header
      className={`${overlay ? "fixed" : "sticky"} inset-x-0 top-0 z-40 transition-colors ${
        light ? "bg-transparent" : "border-b border-sand/70 bg-ivory/90 backdrop-blur"
      }`}
    >
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Logo light={light} />
        <nav className="hidden items-center gap-6 lg:flex" aria-label="منوی اصلی">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`text-sm transition ${
                light ? "text-white/85 hover:text-white" : pathname.startsWith(n.href) ? "font-semibold text-gold-dark" : "text-cocoa hover:text-gold-dark"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <AccountButton light={light} />
          <button
            type="button"
            className={`rounded-lg p-2 lg:hidden ${light ? "text-white" : "text-espresso"}`}
            aria-label="منو"
            aria-expanded={open}
            onClick={() => setOpenPath(open ? null : pathname)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-sand bg-ivory lg:hidden" aria-label="منوی موبایل">
          <div className="container-x flex flex-col py-2">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="border-b border-sand/60 py-3 text-cocoa last:border-0">
                {n.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
