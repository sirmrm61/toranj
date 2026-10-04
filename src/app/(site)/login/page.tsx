import type { Metadata } from "next";
import { cookies } from "next/headers";
import { LoginForm } from "@/components/forms/login-form";
import { REF_COOKIE } from "@/lib/auth/constants";

export const metadata: Metadata = { title: "ورود", robots: { index: false } };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const jar = await cookies();
  const next = typeof sp.next === "string" ? sp.next : undefined;
  return (
    <div className="container-x grid min-h-[70vh] place-items-center py-12">
      <div className="w-full max-w-md space-y-3">
        {sp.reauth && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">برای ورود به پنل مدیریت، دوباره وارد شوید.</p>}
        {sp.blocked && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">حساب کاربری شما مسدود شده است.</p>}
        <LoginForm next={next} hasReferral={jar.has(REF_COOKIE)} />
      </div>
    </div>
  );
}
