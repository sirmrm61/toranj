"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fa } from "@/lib/format";

type Me = { balances: { total: number }; role: "USER" | "ADMIN" };

export function AccountButton({ light = false }: { light?: boolean }) {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setMe)
      .catch(() => setMe(null));
  }, []);

  const cls = light ? "text-white hover:text-gold-light" : "text-espresso hover:text-gold-dark";
  if (me === undefined) return <span className="inline-block h-9 w-24" aria-hidden />;
  if (!me)
    return (
      <Link href="/login" className={`text-sm font-medium ${cls}`}>
        ورود / ثبت‌نام
      </Link>
    );
  return (
    <div className="flex items-center gap-3">
      {me.role === "ADMIN" && (
        <Link href="/admin" className={`hidden text-sm font-medium sm:inline ${cls}`}>
          پنل مدیر
        </Link>
      )}
      <Link href="/account" className={`flex items-center gap-2 text-sm font-medium ${cls}`}>
        حساب من
        <span className="rounded-full bg-gold px-2 py-0.5 text-xs text-white" title="اعتبار پرو آنلاین">
          {fa(me.balances.total)} پرو
        </span>
      </Link>
    </div>
  );
}
