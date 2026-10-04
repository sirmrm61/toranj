import type { Metadata } from "next";
import Link from "next/link";
import { getAccountSummary } from "@/lib/account";
import { requirePageUser } from "@/lib/auth/page";
import { fa } from "@/lib/format";
import { maskPhone } from "@/lib/phone";
import { LogoutButton } from "@/components/account/logout-button";

export const metadata: Metadata = { title: "حساب کاربری", robots: { index: false } };

const NAV = [
  { href: "/account", label: "خلاصه حساب" },
  { href: "/account/tryon", label: "پرو آنلاین جدید" },
  { href: "/account/history", label: "تاریخچه پروها" },
  { href: "/account/wallet", label: "کیف اعتبار و خرید" },
  { href: "/account/invite", label: "دعوت از دوستان" },
];

export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  const user = await requirePageUser("/account");
  const s = await getAccountSummary(user);
  return (
    <div className="container-x grid gap-8 py-10 lg:grid-cols-[260px_1fr]">
      <aside className="space-y-4">
        <div className="card p-5">
          <p className="text-xs text-muted">حساب</p>
          <p className="mt-1 font-semibold text-espresso" dir="ltr">{maskPhone(s.phone)}</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-cream p-3">
              <p className="text-xl font-extrabold text-espresso">{fa(s.balances.free)}</p>
              <p className="text-[11px] text-muted">پرو رایگان</p>
            </div>
            <div className="rounded-xl bg-gold/15 p-3">
              <p className="text-xl font-extrabold text-gold-dark">{fa(s.balances.paid)}</p>
              <p className="text-[11px] text-muted">پرو خریداری‌شده</p>
            </div>
          </div>
        </div>
        <nav className="card overflow-hidden" aria-label="منوی حساب">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="block border-b border-sand/70 px-5 py-3 text-sm text-cocoa last:border-0 hover:bg-cream">
              {n.label}
            </Link>
          ))}
          <LogoutButton />
        </nav>
      </aside>
      <section>{children}</section>
    </div>
  );
}
