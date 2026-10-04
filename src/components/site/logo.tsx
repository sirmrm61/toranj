import Link from "next/link";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="مزون ترنج - صفحه اصلی">
      <svg width="34" height="34" viewBox="0 0 40 40" aria-hidden className={light ? "text-gold-light" : "text-gold"}>
        <path
          d="M20 3c4 6 10 7 14 7-1 5 0 11 3 14-6 1-10 5-12 12-2-4-3-5-5-5s-3 1-5 5c-2-7-6-11-12-12 3-3 4-9 3-14 4 0 10-1 14-7Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <circle cx="20" cy="21" r="4" fill="currentColor" />
      </svg>
      <span className={`text-xl font-extrabold tracking-tight ${light ? "text-white" : "text-espresso"}`}>
        ترنج
        <span className={`mr-1 text-xs font-normal ${light ? "text-white/70" : "text-muted"}`}>مزون عروس</span>
      </span>
    </Link>
  );
}
