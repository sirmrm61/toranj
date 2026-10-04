import Image from "next/image";
import Link from "next/link";
import type { Gown } from "@/generated/prisma/client";
import { gownUrl, MODE_LABELS, STATUS_LABELS, STYLE_LABELS, TYPE_LABELS } from "@/lib/gowns";

export function GownCard({ gown, priority = false }: { gown: Gown; priority?: boolean }) {
  const img = gown.images[0];
  return (
    <Link href={gownUrl(gown)} className="group block overflow-hidden rounded-2xl bg-white ring-1 ring-sand transition hover:-translate-y-0.5 hover:shadow-xl">
      <div className="relative aspect-[2/3] overflow-hidden bg-cream">
        {img && (
          <Image
            src={img}
            alt={`${TYPE_LABELS[gown.type]} مدل ${gown.name} - ${STYLE_LABELS[gown.style]}، ${gown.color}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition duration-500 group-hover:scale-105"
            priority={priority}
          />
        )}
        <div className="absolute top-3 right-3 flex gap-1.5">
          <span className="badge bg-white/90">{MODE_LABELS[gown.mode]}</span>
          {gown.status !== "AVAILABLE" && <span className="badge bg-espresso/80 text-white">{STATUS_LABELS[gown.status]}</span>}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-espresso">{gown.name}</h3>
        <p className="mt-1 line-clamp-1 text-xs text-muted">{gown.tagline ?? TYPE_LABELS[gown.type]}</p>
        {gown.priceRange && <p className="mt-2 text-xs font-medium text-gold-dark">{gown.priceRange}</p>}
      </div>
    </Link>
  );
}
