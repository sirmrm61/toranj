"use client";

import { useState } from "react";
import { api } from "@/lib/client";

export function BuyButton({ packageId, label }: { packageId: string; label: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <>
      <button
        type="button"
        className="btn-gold mt-5 w-full"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setErr(null);
          try {
            const r = await api<{ redirectUrl: string }>("/api/payments/start", { method: "POST", json: { packageId } });
            window.location.assign(r.redirectUrl);
          } catch (e) {
            setErr((e as Error).message);
            setBusy(false);
          }
        }}
      >
        {busy ? "انتقال به درگاه…" : label}
      </button>
      {err && <p className="mt-2 text-xs text-red-700">{err}</p>}
    </>
  );
}
