import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

export function sha256(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

export function hmac(input: string) {
  return createHmac("sha256", env.sessionSecret).update(input).digest("hex");
}

export function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function randomDigits(length: number) {
  return Array.from({ length }, () => randomInt(0, 10)).join("");
}
