import { hmac, safeEqual } from "@/lib/auth/crypto";
import { env } from "@/lib/env";

export type TryonVariant = "preview" | "full";

const payload = (jobId: string, variant: TryonVariant, userId: string, exp: number) =>
  `media:${jobId}:${variant}:${userId}:${exp}`;

/** Short-lived signed URL; the media route also re-checks the session owner (TRD §9). */
export function signTryonUrl(jobId: string, variant: TryonVariant, userId: string, download = false) {
  const exp = Math.floor(Date.now() / 1000) + env.storage.signedUrlTtl;
  const sig = hmac(payload(jobId, variant, userId, exp));
  const qs = new URLSearchParams({ exp: String(exp), sig });
  if (download) qs.set("download", "1");
  return `/api/media/tryon/${jobId}/${variant}?${qs}`;
}

export function verifyTryonSignature(jobId: string, variant: TryonVariant, userId: string, exp: number, sig: string) {
  if (!Number.isFinite(exp) || exp < Date.now() / 1000) return false;
  return safeEqual(sig, hmac(payload(jobId, variant, userId, exp)));
}
