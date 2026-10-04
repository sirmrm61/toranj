import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { requirePageAdmin } from "@/lib/auth/page";

export const metadata: Metadata = { title: "پنل مدیریت", robots: { index: false, follow: false } };

const NAV = [
  { href: "/admin", label: "داشبورد و گزارش" },
  { href: "/admin/gowns", label: "لباس‌ها" },
  { href: "/admin/bookings", label: "رزروها" },
  { href: "/admin/users", label: "کاربران" },
  { href: "/admin/payments", label: "پرداخت‌ها و بسته‌ها" },
  { href: "/admin/referrals", label: "دعوت‌ها" },
  { href: "/admin/tryons", label: "پروها و گزارش‌ها" },
  { href: "/admin/settings", label: "تنظیمات" },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requirePageAdmin();
  return (
    <div className="flex min-h-screen flex-col bg-cream/40">
      <header className="border-b border-sand bg-white">
        <div className="container-x flex h-14 items-center justify-between">
          <Logo />
          <span className="badge">پنل مدیریت</span>
          <Link href="/" className="text-sm text-muted hover:text-espresso">مشاهده سایت</Link>
        </div>
      </header>
      <div className="container-x grid flex-1 gap-6 py-6 lg:grid-cols-[220px_1fr]">
        <nav className="card h-fit overflow-hidden" aria-label="منوی مدیریت">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="block border-b border-sand/60 px-4 py-3 text-sm text-cocoa last:border-0 hover:bg-cream">
              {n.label}
            </Link>
          ))}
        </nav>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
