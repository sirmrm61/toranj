"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="block w-full px-5 py-3 text-right text-sm text-red-700 hover:bg-red-50"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.replace("/");
        router.refresh();
      }}
    >
      خروج از حساب
    </button>
  );
}
