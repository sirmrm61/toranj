"use client";

import { useState } from "react";
import { formatFaDate } from "@/lib/jalali";
import { TryonResult, type TryonView } from "./tryon-result";

export function HistoryList({ items }: { items: (TryonView & { createdAt: string })[] }) {
  const [list, setList] = useState(items);
  if (list.length === 0) return <p className="card p-8 text-center text-sm text-muted">هنوز پرو آنلاینی انجام نداده‌اید.</p>;
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {list.map((j) => (
        <article key={j.id} className="card p-4">
          <header className="mb-3 flex items-center justify-between text-sm">
            <span className="font-semibold text-espresso">{j.gown?.name}</span>
            <span className="text-xs text-muted">{formatFaDate(j.createdAt, true)}</span>
          </header>
          <TryonResult job={j} onDeleted={() => setList((l) => l.filter((x) => x.id !== j.id))} />
          <p className="mt-2 text-[11px] text-muted">{j.bucket === "paid" ? "پرو با اعتبار خریداری‌شده" : "پرو رایگان"}</p>
        </article>
      ))}
    </div>
  );
}
