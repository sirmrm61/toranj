import { faqs } from "@/content/site";

export function FaqList({ items = faqs }: { items?: typeof faqs }) {
  return (
    <div className="divide-y divide-sand rounded-2xl border border-sand bg-white">
      {items.map((f) => (
        <details key={f.q} className="group p-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-espresso">
            {f.q}
            <span className="text-gold transition group-open:rotate-45" aria-hidden>
              +
            </span>
          </summary>
          <p className="mt-3 text-sm leading-7 text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
