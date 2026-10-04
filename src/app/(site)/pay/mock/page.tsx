import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { env } from "@/lib/env";
import { toman } from "@/lib/format";

export const metadata: Metadata = { title: "درگاه آزمایشی", robots: { index: false } };

/** Development-only payment simulator used by PAYMENT_PROVIDER=mock. */
export default async function MockPayPage({ searchParams }: PageProps<"/pay/mock">) {
  if (env.payment.provider !== "mock") notFound();
  const sp = await searchParams;
  const authority = String(sp.authority ?? "");
  const amount = Number(sp.amount ?? 0);
  const callback = `${env.appUrl}/api/payments/callback`;
  const link = (status: "OK" | "NOK") => `${callback}?${new URLSearchParams({ Authority: authority, Status: status })}`;
  return (
    <div className="container-x grid min-h-[60vh] place-items-center py-12">
      <div className="card w-full max-w-md p-8 text-center">
        <p className="badge mx-auto">درگاه پرداخت آزمایشی</p>
        <h1 className="mt-4 text-2xl font-bold text-espresso">{toman(amount)}</h1>
        <p className="mt-2 text-xs text-muted" dir="ltr">{authority}</p>
        <div className="mt-8 flex flex-col gap-3">
          <a href={link("OK")} className="btn-primary py-3.5">پرداخت موفق</a>
          <a href={link("NOK")} className="btn-outline">انصراف از پرداخت</a>
        </div>
      </div>
    </div>
  );
}
